const fs = require('fs')
const gpio = require('rpi-gpio');
/*
Necesario
chmod a+w /sys/devices/w1_bus_master1/w1_master_slaves
chmod a+w /sys/devices/w1_bus_master1/w1_master_remove
chmod a+w /sys/devices/w1_bus_master1/w1_master_search
*/

const READ_FILE = '/sys/devices/w1_bus_master1/w1_master_slaves'
const REMOVE_FILE = '/sys/devices/w1_bus_master1/w1_master_remove'
const LED_GPIO = 0

const IbuttonService = function () {

  let ready = false;

  gpio.promise.setup(LED_GPIO, gpio.DIR_LOW).then(() => {
    ready = true;
  });


  this.turnLed  = async function (mode) {
    if (ready) {
     await gpio.promise.write(LED_GPIO, mode)
    }
  }

  this.read = function () {
    return new Promise( (res, rej) => {
      fs.readFile(READ_FILE, {encoding: 'utf8'},  (err, content) => {
        if (err) {
          console.log('iButton Error: Can\'t read 1wire file '+ e)
          rej('iButton Error: Can\'t read 1wire file')
        }
        if (!content.includes('not found.')) { //Found ID
          content = content.replace(/\r?\n|\r/g, "")
          console.log('IButton read: '+ content +'\n' )
          fs.writeFile(REMOVE_FILE, content, 'utf8', (err) => {
            if (err)
              rej('iButton Error: Cant write to delete file')
            else
              res(content);
          })
        }
        else {
          res(null)
        }
      });
    });
  }



}

module.exports = IbuttonService;