const jwt = require('../modules/jwt')

const TOKEN_EXPIRED = -3;
const TOKEN_INVALID = -2;

const jwtauth = {
  checkToken: async (req, res, next) => {
    console.log("Body: \n", req.body)
    console.log("Authorization(jwt): \n", req.headers.authorization)
    console.log("Fcm token: \n", req.headers["fcm-token"])
    
    const token = req.headers.authorization.split("Bearer ")[1]
    // console.log("JWT token: " + token)

    if (!token)
      return res.status(400).json("No token")
    const user = await jwt.verify(token)
    if (user === TOKEN_EXPIRED)
      return res.status(400).json("Expired token")
    if (user === TOKEN_INVALID)
      return res.status(400).json("Invalid token")
    if (user.id === undefined)
      return res.status(400).json("Invalid token")
    
    req.id = user.id
    next()
  }
}

module.exports = jwtauth