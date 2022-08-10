const axios     = require('axios')
const cryptoJs  = require('crypto-js')
const cache     = require('memory-cache')
const timer     = require('../modules/timer')
const rand      = require('../modules/rand')
const jwt       = require('../modules/jwt')
const User      = require('../models/user')
const Fcm       = require('../models/fcm')

// Create google oauth client to verify token
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
)

function makeSignature(serviceId, timeStamp, accessKey, secretKey) {
  const method    = 'POST'
  const space     = ' '
  const newLine   = '\n'
  const url2      = `/sms/v2/services/${serviceId}/messages`
  
  const hmac = cryptoJs.algo.HMAC.create(cryptoJs.algo.SHA256, secretKey)
  hmac.update(method)
  hmac.update(space)
  hmac.update(url2)
  hmac.update(newLine)
  hmac.update(timeStamp)
  hmac.update(newLine)
  hmac.update(accessKey)

  const hash = hmac.finalize()
  return hash.toString(cryptoJs.enc.Base64)
}

exports.getSmsCode = async function (req, res) {
  console.log("requestSmsCode:\n", req.body)

  const phoneNumber = req.body.phone
  const authNumber = rand.randomNumber(6)
  const vaildTime = 300000 // 5 Minutes

  if (cache.get(phoneNumber)) {
    cache.del(phoneNumber)
    console.log("Duplicate phone number: Cache deleted")
  }
  cache.put(phoneNumber, authNumber, vaildTime)
  timer.countdown(Number(vaildTime))

  try {
    const date = Date.now().toString()
    const uri = `${process.env.SENS_SERVICEID}`
    const url = `https://sens.apigw.ntruss.com/sms/v2/services/${encodeURIComponent(uri)}/messages`
    const secretKey = `${process.env.SENS_SERVICESECRET}`
    const accessKey = `${process.env.SENS_ACCESSKEYID}`

    const response = await axios.post(url,
      JSON.stringify({
        type: "SMS",
        contentType: "COMM",
        countryCode: "82",
        from: `${process.env.SENS_SENDNUMBER}`,
        content: `[Happy] 인증번호 ${authNumber}를 입력해주세요.`,
        messages: [
          { to: `${phoneNumber}` }
        ]
      }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-apigw-timestamp': date,
        'x-ncp-iam-access-key': accessKey,
        'x-ncp-apigw-signature-v2': makeSignature(encodeURIComponent(uri), date, accessKey, secretKey),
      }
    })
    if (!response)
      return res.status(400).json({ message: "Request sms code error" })
    else
      return res.status(200).json()
  } catch(err) {
    console.log(err)
    return res.status(405).json({ message: "Error on server sending authentication message"})
  }
}

exports.signUp = async function (req, res) {
  console.log("signUp:\n", req.body)

  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.oAuthData["oAuthToken"],
      audience: process.env.GOOGLE_CLIENT_ID
    })
    const payload = ticket.getPayload()
  
    const type = req.body.oAuthData["type"]
    const googleId = payload["sub"]
    const phoneNumber = req.body.phone
    const authNumber = req.body.code
    const clientUser = {
      id: type + googleId,
      name: req.body.oAuthData["name"],
      phone: phoneNumber,
      photo_url: req.body.oAuthData["photoUrl"],
      family_id: null
    }
  
    if (!cache.keys()[0])
      return res.status(400).json({ message: "Authentication timed out" })
    else if (!cache.get(phoneNumber))
      return res.status(400).json({ message: "Authentication number is not entered" })
    else if (cache.get(phoneNumber) == authNumber)
      console.log("Message authentication passed")
    else
      return res.status(400).json({ message: "Wrong request: Not verified access" })
  
    const user = await new User(clientUser).save()
    if (!user.id)
      return res.status(400).json({ message: "Error occured in DB" })
    
    const jwtToken = await jwt.sign(clientUser)
    if (!jwtToken)
      return res.status(400).json({ message: "Cannot create jwt token" })
    
    return res.status(200).json()
  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: err })
  }
}

exports.signIn = async function (req, res){
  console.log("signIn:\n", req.body)

  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.oAuthData["oAuthToken"],
      audience: process.env.GOOGLE_CLIENT_ID
    })
    const payload = ticket.getPayload()

    const type = req.body.oAuthData["type"]
    const googleId = payload["sub"]
    const clientUser = {
      id: type + googleId,
    }
  
    const user = await User.findOne({ id: clientUser.id })
    if (!user)
      return res.status(401).json("Invalid user ID")
    
    const fcmToken = req.body.fcmToken
    if (!fcmToken)
      return res.status(400).json({ message: "No FCM token" })

    const jwtToken = await jwt.sign(user)
    if (!jwtToken)
      return res.status(400).json({ message: "Cannot create jwt token" })

    const oldFcmToken = await Fcm.deleteOne({ fcm_token: fcmToken })
    if (!oldFcmToken)
      return res.status(400).json({ message: "Cannot delete FCM token" })

    const fcmDocument = await Fcm.findOneAndUpdate(
      { user_id: user.id },
      { $set: { fcm_token: fcmToken } },
      { upsert: true, new: true }
    )
    if (!fcmDocument)
      return res.status(400).json({ message: "Cannot create fcm token" })
    
    const userData = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      photoUrl: user.photo_url
    }
    const sendData = {
      user: userData,
      token: jwtToken.token,
      familyId: user.family_id
    }

    return res.status(200).json(sendData)

  } catch (err) {
    console.log(err)
    return res.status(401).json({ message: err })
  }
}

