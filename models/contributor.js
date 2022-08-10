const mongoose = require('mongoose')
const auto     = require('../modules/auto')

const ContributorSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    default: 1
  },
  user_id: {
    type: String,
    required: true
  },
  wish_id: {
    type: Number,
    required: true
  }
}, { versionKey: false })

auto(ContributorSchema, mongoose, 'contributor', 'id')
module.exports = mongoose.model('Contibutor', ContributorSchema)