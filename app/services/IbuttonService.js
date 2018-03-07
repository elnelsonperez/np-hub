const fs = require('fs')
const gpio = require('rpi-gpio');

/*
Necesario

modprobe wire timeout=1 slave_ttl=3
modprobe w1-gpio
modprobe w1-smem

sudo chmod a+w /sys/devices/w1_bus_master1/w1_master_slaves
sudo chmod a+w /sys/devices/w1_bus_master1/w1_master_remove
sudo chmod a+w /sys/devices/w1_bus_master1/w1_master_search

To speed the reading time Edit this file as Sudo
/etc/modprobe.d/w1.conf
And add:
options wire timeout=1 slave_ttl=3
*/

const READ_FILE = '/sys/devices/w1_bus_master1/w1_master_slaves'
const REMOVE_FILE = '/sys/devices/w1_bus_master1/w1_master_remove'
const LED_GPIO = 11

const IbuttonService = function () {

  let ready = false;
  let ledState = false;
  let stopBlink = false;

  gpio.promise.setup(LED_GPIO, gpio.DIR_OUT).then(() => {
    gpio.promise.write(LED_GPIO, false).then(() => {
      ready = true;
    })
  });

  this.startBlinking = () => {
    if (stopBlink) {
      stopBlink = false;
    } else {
      this.turnLed(!ledState).then(() => {
        setTimeout(() => {this.startBlinking()},150)
      })
    }
  }

  this.stopBlinking  = () => {
    stopBlink = true;
    this.turnLed(false)
  }

  this.turnLed  = async (mode) => {
    if (ready) {
      await gpio.promise.write(LED_GPIO, mode)
      ledState = mode;
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