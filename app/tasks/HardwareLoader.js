const Task  = require('../core/Task').Task
const delay = require('../../lib/functions').delay;
const reset = require('../../lib/functions').reset;
const props = require('./../App').props
const HardwareLoader = new Task (
    {
      name: 'HardwareLoader',
      inject: ['GprsService', 'BluetoothService','ConfigService']
    }
);

HardwareLoader.run = async function () {
  let fail = false;

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
  while (done === false && counter < 3) {
    try {
      done = await this.GprsService.initialize();
      if (done === false)
        props.applicationEvent.emit('hardwareLoader.message', "Fail. Reintentando")
      await delay(1800);
    }catch (e) {console.log(e)}
    counter++
  }
  if (counter >= 3) {
    throw new Error("GPRS failed to start after 3 times")
  }
}

module.exports = HardwareLoader;