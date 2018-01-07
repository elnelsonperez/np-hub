const ApplicationModule  = require('../../core/Module').ApplicationModule
const delay = require('../../../lib/functions').delay;
const appModule = new ApplicationModule (
    {
        name : 'HardWareLoader',
        start : 0,
        end : 19,
        line : 3,
        scrolling: false,
        inject: ['GprsManager', 'BluetoothService']
    }
);

appModule.initialize = async function () {
  let fail = false;

  try {
    await this.initializeGprs()
  } catch (e) {
    console.log(e)
    fail = true;
    this.data.msg = "Gprs Fail"
  }

  try {
    this.initializeBluetooth()
  } catch (e) {
    console.log(e)
    fail = true;
    this.data.msg = "Bluetooh Fail"
  }

  if (fail === false) {
    this.data.msg = "Modulos Listos"
    this.props.applicationEvent.emit('boot.ready')
  } else {
    //Shit does not work. Reboot?
    require('child_process').exec('sudo /sbin/shutdown -r now', function (msg) { console.log(msg)});
  }

}

appModule.initializeBluetooth = function () {
  this.data.msg = "Bluetooth Init"
  this.BluetoothService.initialize()
}

appModule.initializeGprs = async function () {
  this.GprsManager.on('message', (msg) => {
    this.data.msg = msg;
  })
  let done = false;
  let counter = 0;
  while (done === false && counter < 3) {
    try {
      done = await this.GprsManager.initialize();
      if (done === false)
        this.data.msg = "Fail. Reintentando"
      await delay(1800);
    }catch (e) {console.log(e)}
    counter++
  }
  if (counter >= 3) {
    throw new Error("GPRS failed to start after 3 times")
  }
}

appModule.view = function (msg) {
    if (this.data.msg)
        return this.data.msg
    else
        return msg;
}

appModule.controller = function () {
    return this.view('Cargando Modulos');
}

module.exports = appModule;