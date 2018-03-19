
module.exports = {
  delay(t) {
    return new Promise(function(resolve) {
      setTimeout(resolve, t)
    })
  },
  sleep (fn, par) {
    return new Promise((resolve) => {
      // wait 3s before calling fn(par)
      setTimeout(() => resolve(fn(par)), 3000)
    })
  },
  reset () {
    require('child_process').exec('sudo /sbin/shutdown -r now', function (msg) { console.log(msg)});
  },
  shutdown () {
    require('child_process').exec('sudo /sbin/shutdown now', function (msg) { console.log(msg)});
  }
}
