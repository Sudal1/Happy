const mongoose   = require('mongoose')
const auto       = require('../modules/auto')
const date     = require('../modules/date')

const WishSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    default: 1
  },
  user_id: String,
  title: {
    type: String,
    required: true
  },
  content: String,
  timestamp_open: {
    type: String,
    required: true,
    default: date.now()
  },
  timestamp_close: {
    type: String,
    required: false,
    default: null
  }
}, { versionKey: false })

auto(WishSchema, mongoose, 'wish', 'id')
module.exports = mongoose.model('Wish', WishSchema)