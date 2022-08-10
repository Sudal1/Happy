exports.countdown = async function (vaildTime){
  let endTime, secs, mins, msLeft, time
  twoDigits = (n) => { return (n <= 9 ? "0" + n : n) }
  updateTimer = () => {
    msLeft = endTime - (+new Date)
   if (msLeft < 1000) {
     console.log('***Cache deleted***')
   } else {
     time = new Date(msLeft)
     mins = time.getUTCMinutes()
     secs = time.getUTCSeconds()
     msgTime = (mins ? mins + '분' + twoDigits(secs) : secs) + '초'
     var msg = '남은 시간: ' + msgTime
     setTimeout(updateTimer, time.getUTCMilliseconds() + 500)
     // console.log(msg)
   }
  }
  endTime = (+new Date) + vaildTime + 500
  updateTimer()
}