const gpio = require('rpi-gpio');

gpio.setup(33, gpio.DIR_IN,function (err) {
    if (err)
        throw err
    
    setInterval(function () {
        gpio.read(33, function (err, val) {
            if (err)
                throw err
            console.log(val)
        })
    },150)

});