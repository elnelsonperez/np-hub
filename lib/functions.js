
module.exports = {
    delay(t) {
        return new Promise(function(resolve) {
            setTimeout(resolve, t)
        })
    }
    ,sleep (fn, par) {
        return new Promise((resolve) => {
            // wait 3s before calling fn(par)
            setTimeout(() => resolve(fn(par)), 3000)
        })
    }
}
