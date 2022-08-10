const path    = require('path')
const dotenv  = require('dotenv')
dotenv.config({ path: './config/config.env' }) // Load config

const morgan  = require('morgan')
const express = require('express')
const app     = express()


// Connect to MongoDB
const connectDB  = require('./config/db')
connectDB() 

// Static folder
const jwtauth = require('./middlewares/jwtauth').checkToken
// const auth    = require('./middlewares/auth').checkId
app.use('/uploads', jwtauth, express.static(path.join(__dirname, './uploads')))
app.use(express.static(path.join(__dirname, 'public')))

// Set global var
app.use(function (req, res, next) {
  res.locals.user = req.user || null
  next()
})

// Body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logging for dev
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Routes
const router = require('./routes/index')
app.use('/', router)

// Running server on PORT
app.set('PORT', process.env.PORT || 5000)
app.listen(app.get('PORT'), function() {
  console.log('Server running on port ' + app.get('PORT'))
})

module.exports = app