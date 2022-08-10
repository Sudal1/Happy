const rand     = require('../modules/rand.js')
const Family   = require('../models/family')
const User     = require('../models/user')
const member   = require('./member')

function createFamilyId(){
  var familyId = ""
  do {
    familyId = rand.randomString(16)
    if (Family.find({ id: familyId }).count() > 0) { familyId = "" }
    else { break }
  } while (true)
  console.log("Successfully created family ID: ", familyId)
  return familyId
}

exports.getFamily = async function (req, res){
  console.log("Create Family: " + req.id)

  try {
    const familyId = createFamilyId()
    const clientFamily = {
      id: familyId,
      user_list: { user_id: req.id }
    }

    const response = await new Family(clientFamily).save()
    if (!response.id)
      return res.status(401).json({ msg: "Error occured in DB" })
    
    const response2 = await User.findOneAndUpdate(
      { id: req.id },
      { $set : { family_id: familyId } }
    )
    if (!response2.id) {
      await Family.deleteOne({ id: familyId })
      return res.status(401).json({ message: "Error occured in DB" })
    }
 
    return res.status(200).json({ familyId: familyId })
  } catch (err) {
    console.log(err)
    return res.status(401).json({ message: err })
  }
}

exports.joinFamily = async function (req, res){
  console.log("Join Family: " + req.id)

  try {
    const user = await member.getMember(req.id)
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })
    const familyId = user.family_id
    const reqFamilyId = req.body.familyId

    const response = await User.findOneAndUpdate(
      { id: user.id },
      { $set : { family_id: reqFamilyId } }
    )
    if (!response)
      return res.status(400).json({ message: "Invalid user ID" })

    const response2 = await Family.findOneAndUpdate(
      { id: reqFamilyId },
      { $push : { user_list: { user_id: user.id } } }
    )
    if (!response2) {
      await User.findOneAndUpdate(
        { id: user.id },
        { $set : { family_id: familyId } }
      )
      return res.status(400).json({ message: "Invalid family ID" })
    }

    return res.status(200).json({ familyId: reqFamilyId })
  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Error occured in DB" })
  }
}

exports.leaveFamily = async function (req, res){
  console.log("Leave Family: " + req.id)

  try {
    const user = await member.getMember(req.id)
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })
    
    const response = await Family.findOneAndUpdate(
      { id: user.family_id },
      { $pull: { user_list: { user_id: user.id } } },
      { upsert: false, multi: true }
    )
    if (!response.id)
      return res.status(400).json({ message: "Invalid family ID" })

    const response2 = await User.findOneAndUpdate(
      { id: user.id },
      { $set : { family_id: null } }
    )
    if (!response2.id)
      return res.status(400).json({ message: "Invalid user ID" })

    return res.status(200).json({ message: "Successfully leave family" })
  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Error occured in DB" })
  }
}
