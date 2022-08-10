exports.randomNumber = function (length){
  var result = ""
  for (var i = 0; i < length; i++) {
    result += parseInt(Math.random() * (10))
  }
  return result
}

exports.randomString = function (length){
  var result           = [];
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var charactersLength = characters.length
  for ( var i = 0; i < length; i++ ) {
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)))
  }
  return result.join('')
}