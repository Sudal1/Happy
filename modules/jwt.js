const jwt = require('jsonwebtoken')

const secretKey = process.env.SECRET_KEY
const TOKEN_INVALID = -2
const TOKEN_EXPIRED = -3

module.exports = {
    sign: async (user) => {
        const payload = {
            id: user.id
        }
        const result = {
            token: jwt.sign(payload, secretKey, {algorithm: "HS256", issuer: "happy"})
        }
        console.log("Token made: ", result.token)
        return result
    },

    verify: async (token) => {
        let decoded
        try {
            decoded = jwt.verify(token, secretKey)
        } catch (err) {
            if (err.message === "jwt expired") {
                console.log("expired token")
                return TOKEN_EXPIRED
            } else if (err.message === "invalid token") {
                console.log("invalid token: " + TOKEN_INVALID)
                return TOKEN_INVALID
            } else {
                console.log("invalid token")
                return TOKEN_INVALID
            }
        }
        return decoded
    }
}