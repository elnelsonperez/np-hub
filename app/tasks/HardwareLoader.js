const Task  = require('../core/Task').Task
const delay = require('../../lib/functions').delay;
const reset = require('../../lib/functions').reset;
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
    this.props.applicationEvent.emit('hardwareLoader.message', "Gprs Fail")
  }

  try {
    this.initializeBluetooth()
  } catch (e) {
    console.log(e)
    fail = true;
    this.props.applicationEvent.emit('hardwareLoader.message', "Bluetooh Fail")

  }

  if (fail === false) {
    this.props.applicationEvent.emit('boot.ready')
  }
  else {
    //Shit does not work. Reboot?
    // reset()
  }
}


HardwareLoader.getNpHubConfiguration  = async function () {
  this.ConfigService.on("error_message", (message) => {
    this.props.applicationEvent.emit('hardwareLoader.message', message)
  })
  let tries = 0;
  while (tries < 5) {
    let config = await this.ConfigService.getDeviceConfiguration(this.props.serialNumber);
    if (config) {
      return config;
    }
    tries++;
  }
  reset();
  return null;
}

HardwareLoader.initializeBluetooth = function () {
  this.props.applicationEvent.emit('hardwareLoader.message', "Bluetooth Init")
  this.props.input.on('INPUT:btReset:PRESSED', () => {
    this.BluetoothService.reset()
  })
  this.props.input.on('INPUT:btDiscoverable:PRESSED', () => {
    this.BluetoothService.makeDiscoverable()
  })
  this.BluetoothService.initialize()
}

HardwareLoader.initializeGprs = async function () {
  this.GprsService.on('message', (msg) => {
    this.props.applicationEvent.emit('hardwareLoader.message', msg)
  })
  let done = false;
  let counter = 0;
  while (done === false && counter < 3) {
    try {
      done = await this.GprsService.initialize();
      if (done === false)
        this.props.applicationEvent.emit('hardwareLoader.message', "Fail. Reintentando")
      await delay(1800);
    }catch (e) {console.log(e)}
    counter++
  }
  if (counter >= 3) {
    throw new Error("GPRS failed to start after 3 times")
  }
}

module.exports = HardwareLoader;