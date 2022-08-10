const mongoose = require('mongoose')
const auto     = require('../modules/auto')
const date     = require('../modules/date')

const MailSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    default: 1
  },
  from_user_id: {
    type: String,
    required: true
  },
  to_user_id: String,
  content: String,
  read: {
    type: Boolean,
    default: false
  },
  rating: Number,
  timestamp: {
    type: String,
    default: date.now()
  },
  time_sent: {
    type: String,
    default: null
  }
}, { versionKey: false })

auto(MailSchema, mongoose, 'mail', 'id')
module.exports = mongoose.model('Mail', MailSchema)