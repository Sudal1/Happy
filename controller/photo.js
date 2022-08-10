const fs        = require('fs')
const camelKeys = require('camelcase-keys')
const date      = require('../modules/date')
const Photo     = require('../models/photo')
const Event     = require('../models/event')
const Tag       = require('../models/tag')
const member    = require('./member')

exports.uploadPhoto = async function (req, res, next){
  console.log("upload: " + req.id)
  
  try {
    const user     = await member.getMember(req.id)
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })
    
    const files    = req.files
    if (!files)
      return res.status(400).json({ message: "Please choose the files" })
    
    const body     = JSON.parse(JSON.stringify(req.body))
    let userIds    = []
    let eventId    = null
    let event      = null
    let tags       = null
  
    if (body.isNewEvent == "true" || body.isNewEvent == true) {
      if (typeof body.userIds === 'string' || body.userIds instanceof String)
        userIds.push(body.userIds.replace(/\"/gi, ""))
      else {
        userIds = await Promise.all(
          body.userIds.map((src) => {
            return src.replace(/\"/gi, "")
          })
        )
      }

      const newEvent = {
        family_id: user.family_id,
        name: body.eventName.replace(/\"/gi, ""),
        timestamp: date.now()
      }
      
      const response = await new Event(newEvent).save()
      if (!response)
        return res.status(400).json({ message: "Error occured in DB" })
      else {
        eventId = response.id
        event   = response.toObject()
        delete event.family_id
        delete event._id

        const newTags = await Promise.all(
          userIds.map(async (userId) => {
            const newTag = {
              user_id: userId,
              event_id: eventId
            }
            const response2 = await new Tag(newTag).save()
            if (!response2)
              return []
            else
              return response2
          })
        )
        tags = newTags.flat()
      }
    } else {
      const existedEvent = await Event.findOne({ name: body.eventName.replace(/\"/gi, "") })
      eventId = existedEvent.id
      event = existedEvent.toObject()
      delete event.family_id
      delete event._id
      const existedTags = await Tag.find({ event_id: existedEvent.id })
      tags = existedTags.flat()
    }
  
    const photoArray = await files.map((file) => {
      return fs.readFileSync(file.path)
    })
    
    const photos = await Promise.all(
      photoArray.map(async (src, index) => {
        const newPhoto = {
          url: `https://happyfamily.tk/${files[index].path}`,
          user_id: req.id,
          event_id: eventId,
          timestamp: date.now()
        }
        const response = await new Photo(newPhoto).save()
        if (!response)
          return null
        else 
          return camelKeys(newPhoto)
      })
    )

    const sendTags = await Promise.all(
      tags.map(async (tag) => {
        tag = tag.toObject()
        delete tag._id
        return camelKeys(tag)
      })
    )

    res.status(200).json({ event: camelKeys(event), photos: photos, tags: sendTags })

  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Error occured in DB" })
  }
}

exports.movePhoto = async function (req, res){
  console.log("movePhoto: " + req.id)

  try {
    const user = await member.getMember(req.id)
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })
    
    const urls = req.body.photoUrls
    if (!urls)
      return res.status(400).json({ message: "Please enter the urls" })
    
    let photos = await Promise.all(
      urls.map(async (url) => {
        const photoDocument = await Photo.findOne({ url: url })
        
        const photo = await Photo.findOneAndUpdate(
          { url: url },
          { $set: { event_id: req.body.eventId } },
          { new: true }
        )
        if (!photo)
          return res.status(400).json({ message: "Invalid photo url" })
        else {
          const oldPhoto = await Photo.findOne({ event_id: photoDocument.event_id })
          if (!oldPhoto)
            await Event.deleteOne({ id: photoDocument.event_id })
          photo.toObject()
          delete photo._id
          return camelKeys(photo)
        }
      })
    )
    photos = photos.flat()
    
    return res.status(200).json()
  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Error occured in DB" })
  }
}

exports.syncPhoto = async function (req, res, next){
  console.log("getPhotoUrls: " + req.id)

  try {
    const user = await member.getMember(req.id)
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })

    const events = await Event.find({ family_id: user.family_id })
    if (!events)
      return res.status(400).json({ message: "Invalid user ID" })

    let photos = await Promise.all(
      events.map(async (event_) => {
        return await Photo.find({ event_id: event_.id })
      })
    )
    photos = photos.flat()

    let tags = await Promise.all(
      events.map(async (event_) => {
        return await Tag.find({ event_id: event_.id })
      })
    )
    tags = tags.flat()

    const sendEvents = await Promise.all(
      events.map(async (src) => {
        src = src.toObject()
        delete src._id
        return camelKeys(src)
      })
    )

    const sendPhotos = await Promise.all(
      photos.map(async (src) => {
        src = src.toObject()
        delete src._id
        return camelKeys(src)
      })
    )

    const sendTags = await Promise.all(
      tags.map(async (tag) => {
        tag = tag.toObject()
        delete tag._id
        return camelKeys(tag)
      })
    )

    return res.status(200).json({ events: sendEvents, tags: sendTags, photos: sendPhotos })
  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Error occured in DB" })
  }
}

exports.deletePhoto = async function (req, res){
  console.log("deletePhotos: " + req.id)

  try {
    const user = await member.getMember(req.id)
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })
    
    const urls = req.body.photoUrls
    if (!urls)
      return res.status(400).json({ message: "Please enter the urls" })

    const photos = await Promise.all(
      urls.map(async (url) => {
        const photo = await Photo.findOne({url: url })
        const eventId = photo.event_id

        const response = await Photo.deleteOne({ url: url })
        if (response.ok != 1)
          return null
        else {
          if (!await Photo.countDocuments({ event_id: eventId })) {
            await Event.deleteOne({ id: eventId })
            await Tag.deleteMany({ event_id: eventId })
          }
            
          url = url.split("/")[4]
          fs.unlinkSync("uploads/" + url, (err) => {
            if (err)
              console.log("Failed to delete local photo:", url)
            else
              console.log("Successfully deleted local photo")
          })
          return response
        }
      })
    )
    
    return res.status(200).json()
  } catch (err) {
    console.log(err)
    return res.status(400).json({ message: "Error occured in DB" })
  }
}
