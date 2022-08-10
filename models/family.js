const mongoose = require('mongoose')

const FamilySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  user_list: [{
    user_id: {
      type: String,
      unique: true
    }
  }]
}, { versionKey: false, autoIndex: false })

module.exports = mongoose.model('Family', FamilySchema)