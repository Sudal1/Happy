const mongoose = require('mongoose')

const FcmSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true
  },
  fcm_token: {
    type: String,
    unique: true
  }
}, { versionKey: false })

module.exports = mongoose.model('Fcm', FcmSchema)