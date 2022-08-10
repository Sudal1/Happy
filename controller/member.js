const User = require('../models/user')

exports.getMember = async function (userId) {
  try {
    const user = await User.findOne({ id: userId })
    if (!user)
      return null
    else
      return user
  } catch (err) {
    console.log(err)
    return null
  }
}

exports.getMembers = async function (req, res){
  console.log("getMembers: " + req.id)

  try {
    const user = await User.findOne({ id: req.id })
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })

    const members = []

    const users = await User.find({ family_id: user.family_id })
    users.forEach(member => {
      const MemberData = {
        "id": member.id,
        "name": member.name,
        "phone": member.phone,
        "photoUrl": member.photo_url
      }
      members.push(MemberData)
    })
    return res.status(200).json({ users: members })
  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Error occured in DB" })
  }
}

exports.resetAllMembers = async function (req, res){
  console.log("Reset all users data")

  try {
    const response = await User.deleteMany({})
    if (response.ok != 1)
      return res.status(400).json({ message: "Error occured in DB" })
    else
      return res.status(200).json({ message: "Successfully deleted" })
  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Error occured in DB" })
  }
}