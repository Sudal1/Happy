const mongoose = require('mongoose')
const auto     = require('../modules/auto')

const TagSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    default: 1
  },
  user_id: String,
  event_id: {
    type: Number,
    required: true
  }
}, { versionKey: false })

auto(TagSchema, mongoose, 'tag', 'id')
module.exports = mongoose.model('Tag', TagSchema)