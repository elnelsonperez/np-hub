const fs = require('fs')
const gpio = require('rpi-gpio');
const interval = require('interval-promise')

const READ_FILE = '/sys/devices/w1_bus_master1/w1_master_slaves'
const REMOVE_FILE = '/sys/devices/w1_bus_master1/w1_master_remove'
const LED_GPIO = 11

/**
 * Se encarga de manejar el lector de iButtons.
 * @constructor
 */
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

  this.readOnlyValid = function () {
    return new Promise(res => {
      interval(async (iteration, stop) => {
        const result = await this.read()
        if (result !== null) {
          stop()
          res(result)
        }
      }, 500)
    })
  }

}

module.exports = IbuttonService;