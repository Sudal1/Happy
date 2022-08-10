const camelKeys   = require('camelcase-keys')
const date        = require('../modules/date')
const Contributor = require('../models/contributor')
const Wish        = require('../models/wish')
const User        = require('../models/user')
const member      = require('./member')

exports.writeWish = async function (req, res){
  console.log("writeWish: " + req.id)

  const user = await member.getMember(req.id)
  if (!user)
    return res.status(400).json({ message: "Invalid user ID" })

  if (req.body.id) {
    try {
      const response = await Wish.findOneAndUpdate(
        { id: req.body.id },
        { $set: { title: req.body.title, content: req.body.content } },
        { new: true }
      )
      if (!response)
        return res.status(400).json({ message: "Invalid wish ID" })
      else {
        const sendResponse = response.toObject()
        delete sendResponse._id
        return res.status(200).json({ wish: camelKeys(sendResponse) })
      }
    } catch (err) {
      console.log(err)
      return res.status(400).json({ message: "Error occured in DB" })
    }
  }
  else {
    try {
      const newWish = {
        user_id: user.id,
        title: req.body.title,
        content: req.body.content,
        timestamp_open: date.now()
      }
  
      const response = await new Wish(newWish).save()
      if (!response)
        return res.status(400).json({ message: "Error occured in DB" })
      else {
        const sendResponse = response.toObject()
        delete sendResponse._id
        return res.status(200).json({ wish: camelKeys(sendResponse) })
      }
    } catch (err) {
      console.log(err)
      return res.status(400).json({ message: err })
    }
  }
}

exports.syncWish = async function (req, res, next){
  console.log("getWish: " + req.id)

  try {
    const user = await member.getMember(req.id)
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })

    const users = await User.find({ family_id: user.family_id })
    if(!users)
      return res.status(400).json({ message: "No User matched with family_id" })

    
    let wishes = await Promise.all(
      users.map(async (src) => {
        return await Wish.find({ user_id: src.id })
      })
    )
    wishes = wishes.flat()
    
    let contributors = await Promise.all(
      wishes.map(async (src) => {
        return await Contributor.find({ wish_id: src.id })
      })
    )
    contributors = contributors.flat()
    
    const sendWishes = await Promise.all(
      wishes.map(async (src) => {
        src = src.toObject()
        delete src._id
        return camelKeys(src)
      })
    )
    
    const sendContributors = await Promise.all(
      contributors.map(async (src) => {
        src = src.toObject()
        delete src._id
        return camelKeys(src)
      })
    )

    return res.status(200).json({ wishes: sendWishes, contributors: sendContributors })
  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Error occured in DB" })
  }
}

exports.deleteWish = async function (req, res){
  console.log("deleteWish: " + req.id)

  try {
    const user = await member.getMember(req.id)
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })

    const response = await Wish.deleteOne({ id: req.body.wishId })
    if (response.ok != 1)
      return res.status(400).json({ message: "No wishes in DB" })
    
    const response2 = await Contributor.deleteMany({ wish_id: req.body.wishId })
    if (response2.ok != 1)
      return res.status(400).json({ message: "Cannot delete wish" })

    return res.status(200).json()
  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Error occured in DB" })
  }
}

exports.finishWish = async function (req, res){
  console.log("finishWish: " + req.id)

  try {
    const user = await member.getMember(req.id)
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })

    const wish = await Wish.findOneAndUpdate(
      { id: req.body.wishId },
      { $set: { timestamp_close: date.now() } },
      { new: true }
    )
    if (!wish)
      return res.status(400).json({ message: "No wishes in DB" })
    const sendWish = wish.toObject()
    delete sendWish._id
    
    const contributors = await Promise.all(
      req.body.contributors.map(async (contributor) => {
        const newContributor = {
          user_id: contributor,
          wish_id: wish.id
        }
        if (!await Contributor.countDocuments(newContributor))
          return await new Contributor(newContributor).save()
        else
          return await Contributor.findOne(newContributor)
      })
    )
    const sendContributors = await Promise.all(
      contributors.map(async (src) => {
        src = src.toObject()
        delete src._id
        return camelKeys(src)
      })
    )

    return res.status(200).json({ wish: camelKeys(sendWish), contributors: sendContributors })

  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Error occured in DB" })
  }
}