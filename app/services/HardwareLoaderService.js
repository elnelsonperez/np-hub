const delay = require('../../lib/functions').delay;
const reset = require('../../lib/functions').reset;
const props = require('./../shared/props')

/**
 * Se encarga de inicializar el BluetoothService, Gprs y mandar a buscar las configuraciones iniciales al server.
 * @param {GprsService} GprsService
 * @param {BluetoothService} BluetoothService
 * @param {ConfigService} ConfigService
 * @constructor
 */

const HardwareLoaderService = function ({GprsService, BluetoothService, ConfigService}) {

  this.GprsService = GprsService;
  this.BluetoothService = BluetoothService;
  this.ConfigService = ConfigService;
  this.load = async () => {

    let fail = false;
    this.GprsService.on('networkError', () => {
      this.initializeGprs().then(r => {
        if (r !== true) {
          //Reset the shit
          reset()
        }
      }).catch(e => {
        reset()
      })
    })

    try {
      this.initializeBluetooth()
    } catch (e) {
      console.log(e)
      props.applicationEvent.emit('hardwareLoader.message', "Bluetooh Fail")
    }

    try {
      await this.initializeGprs()
    } catch (e) {
      console.log(e)
      fail = true;
      props.applicationEvent.emit('hardwareLoader.message', "Gprs Fail")
    }

    if (fail === false) {
      props.applicationEvent.emit('boot.ready')
      await this.getNpHubConfiguration()
    }
    else {
      //Shit does not work. Reboot?
       reset()
    }
  }

  this.getNpHubConfiguration = async () => {
    this.ConfigService.on("error_message", (message) => {
      props.applicationEvent.emit('hardwareLoader.message', message)
    })
    let tries = 0;
    while (tries < 5) {
      let config = await this.ConfigService.getDeviceConfiguration();
      if (config) {
        props.applicationEvent.emit('config.ready', config)
        return;
      }
      tries++;
    }
    //Could not fetch config reset?
    // reset();
  }

  this.initializeBluetooth = (config) => {
    props.applicationEvent.emit('hardwareLoader.message', "Bluetooth Init")
    props.input.on('INPUT:btReset:PRESSED', () => {
      this.BluetoothService.reset()
    })
    props.input.on('INPUT:btDiscoverable:PRESSED', () => {
      this.BluetoothService.makeDiscoverable()
    })
    props.applicationEvent.once('config.ready', config => {
      this.BluetoothService.initialize({allowedMacAddresses: config.allowedMacAddresses})
    })
  }

  this.initializeGprs = async () => {
    this.GprsService.on('message', (msg) => {
      props.applicationEvent.emit('hardwareLoader.message', msg)
    })
    let done = false;
    let counter = 0;
    while (done === false && counter < 5) {
      try {
        done = await this.GprsService.initialize();
        if (done === false) {
          props.applicationEvent.emit('hardwareLoader.message', "Fail. Reintentando")
          await delay(4000);
        }
      } catch (e) {console.log(e)}
      counter++
    }
    if (counter >= 5) {
      throw new Error("GPRS failed to start after 5 times")
    }
    return true;
  }

}

module.exports = HardwareLoaderService;