const camelKeys = require('camelcase-keys')
const admin     = require('../modules/admin')
const date      = require('../modules/date')
const Mail      = require('../models/mail')
const Fcm       = require('../models/fcm')
const member    = require('./member')

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

exports.writeMail = async function (req, res){
  console.log("writeMail: " + req.id)

  try {
    const user = await member.getMember(req.id)
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })

    const newMail = {
      to_user_id: req.body.toUserId,
      from_user_id: user.id,
      content: req.body.content,
    }

    const response = await new Mail(newMail).save()
    if (!response)
      return res.status(400).json({ message: "Cannot save new mail" })
    
    const fcmDocument = await Fcm.findOne({ user_id: newMail.to_user_id })
    if (!fcmDocument) {
      await Mail.findOneAndUpdate(
        newMail,
        { $set: { time_sent: date.now() } },
        { upsert: false, multi: false }
      )
      return res.status(200).json()
    }
    
    const newMsg = {
      data: {
        title: "Happy님이 보낸 메세지",
        body: "잘 가나요?"
      },
      token: fcmDocument.fcm_token,
    }

    const sendedMsg = await admin.messaging().send(newMsg)
    if (!sendedMsg)
      return res.status(400).json({ message: "Push message failed" })

    const mail = await Mail.findOneAndUpdate(
      { id: response.id },
      { $set: { time_sent: date.now() } },
      { upsert: false, multi: false }
    )
    if (!mail)
      return res.status(400).json({ message: "Error occured in DB" })

    return res.status(200).json()

  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Error occured in DB" })
  }
}

exports.syncMail = async function (req, res){
  console.log("syncMail: " + req.id)

  try {
    const user = await member.getMember(req.id)
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })
    
    const mails = await Mail.find({ to_user_id: user.id, read: false })
    if (!mails)
      return res.status(400).json({ message: "No mail matched" })

    let sendMails = await Promise.all(
      mails.map(async (mail) => {
        const sendUser = await member.getMember(mail.from_user_id)
        if (sendUser.family_id != user.family_id)
          return []
        mail = mail.toObject()
        delete mail._id
        if (mail.time_sent)
          return camelKeys(mail)
        else
          return []
      })
    )
    sendMails = sendMails.flat()

    return res.status(200).json({ mails: sendMails })

  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Error occured in DB" })
  }
}

exports.markMail = async function (req, res){
  console.log("markMail: " + req.id)

  try {
    const user = await member.getMember(req.id)
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })
    
    const mail = await Mail.findOneAndUpdate(
      { id: req.body.mailId },
      { $set: { read: true, rating: req.body.rating } },
      { upsert: false, multi: false }
    )
    if (!mail)
      return res.status(400).json({ message: "Cannot update mail" })
    else
      return res.status(200).json() 
  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Error occured in DB" })
  }
}

exports.sendPush = async function (req, res){
  console.log("sendPush: " + req.id)

  try {
    const target_token = req.body.fcmToken

    const msg = {
      data: {
        title: "Happy님이 보낸 메세지",
        body: "수동 푸시 보내용"
      },
      token: target_token,
    }

    const response = await admin.messaging().send(msg)
    if (!response)
      return res.status(400).json({ message: "Push message failed" })
    else
      return res.status(200).json()
  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Push message failed" })
  }
}