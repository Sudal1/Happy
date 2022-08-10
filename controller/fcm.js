const Fcm = require('../models/fcm')

exports.createFcm = async function (req, res){
  console.log("createFcm: " + req.id)
    
  try {
    const user = await member.getMember(req.id)
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })

    const response = await Fcm.findOneAndUpdate(
      { user_id: user.id },
      { $set: { fcm_token: req.body.fcmToken } },
      { upsert: true, new: true }
    )

    if (!response)
      return res.status(400).json({ message: "Error occured in DB" })
    else
      return res.status(200).json()
  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: err })
  }
}