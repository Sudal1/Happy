const mongoose = require('mongoose')
const date     = require('../modules/date')

const PhotoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true
  },
  user_id: String,
  event_id: Number,
  timestamp: {
    type: String,
    default: date.now()
  }
}, { versionKey: false })

module.exports = mongoose.model('Photo', PhotoSchema)