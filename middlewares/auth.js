const url    = require('url')
const member = require('../controller/member')

const auth = {
  checkId: async (req, res, next) => {
    console.log("Check user ID: " + req.id)
    
    const reqUrl = req.url
    console.log("Url: " + reqUrl)

    const user = await member.getMember(req.id)
    if (!user)
      return res.status(400).json({ message: "Invalid user ID" })
    
    next()
  }
}

module.exports = auth