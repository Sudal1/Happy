const mongoose = require('mongoose')
const auto     = require('../modules/auto')
const date     = require('../modules/date')

const EventSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    default: 1
  },
  family_id: String,
  name: String,
  timestamp: { 
    type: String,
    default: date.now()
  }
}, { versionKey: false })

auto(EventSchema, mongoose, 'event', 'id')
module.exports = mongoose.model('Event', EventSchema)