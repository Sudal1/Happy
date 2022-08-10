const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true
    },
    name: String,
    phone: String,
    photo_url: String,
    family_id: {
        type: String,
        required: false,
        default: null
    }
}, { versionKey: false, autoIndex: false })

module.exports = mongoose.model('User', UserSchema)