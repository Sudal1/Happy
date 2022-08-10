const admin          = require('firebase-admin')
const serviceAccount = require('../config/firebase-key.json')

module.exports = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})