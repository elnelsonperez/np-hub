const Task  = require('../core/Task').Task
const delay = require('../../lib/functions').delay;
const reset = require('../../lib/functions').reset;
const props = require('./../App').props

/**
 * Se encarga de inicializar el Bluetooth, modulo GPRS, y conseguir las configuraciones
 * del hub.
 * @type {Task}
 */
const HardwareLoader = new Task (
    {
      name: 'HardwareLoader',
      inject: ['GprsService', 'BluetoothService','ConfigService'],
      every: null,
      autoload: false
    }
);
HardwareLoader.initialize = async function () {
  let fail = false;

  this.GprsService.on('networkError', () => {
    this.initializeGprs().then(r => {
      if (r !== true) {
        //Reset the shit
        console.log("============== WOULD RESET =====================")
      }
    }).catch(e => {
      console.log("============== WOULD RESET =====================")
    })
  })

  try {
    await this.initializeGprs()
  } catch (e) {
    console.log(e)
    fail = true;
    props.applicationEvent.emit('hardwareLoader.message', "Gprs Fail")
  }

  try {
    this.initializeBluetooth()
  } catch (e) {
    console.log(e)
    props.applicationEvent.emit('hardwareLoader.message', "Bluetooh Fail")
  }

  if (fail === false) {
    props.applicationEvent.emit('boot.ready')
    await this.getNpHubConfiguration()
  }
  else {

    console.log("============== WOULD RESET =====================")
    //Shit does not work. Reboot?
    // reset()
  }
}

HardwareLoader.getNpHubConfiguration  = async function () {
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

HardwareLoader.initializeBluetooth = function (config) {
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

HardwareLoader.initializeGprs = async function () {
  this.GprsService.on('message', (msg) => {
    props.applicationEvent.emit('hardwareLoader.message', msg)
  })
  let done = false;
  let counter = 0;
  while (done === false && counter < 5) {
    try {
      done = await this.GprsService.initialize();
      console.log(" ==================> GPRS INITIALIZE RETURN: ", done);
      if (done === false)
        props.applicationEvent.emit('hardwareLoader.message', "Fail. Reintentando")
      await delay(4000);
    } catch (e) {console.log(e)}
    counter++
  }
  if (counter >= 5) {
    throw new Error("GPRS failed to start after 5 times")
  }
  return true;
}

module.exports = HardwareLoader;