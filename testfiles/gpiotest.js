const gpio = require('rpi-gpio');

gpio.setup(11, gpio.DIR_OUT,function (err) {
  if (err)
    throw err
  gpio.write(11,false, function (err) {
    if (err)
      throw err
  })
});