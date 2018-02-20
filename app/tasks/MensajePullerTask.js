const Task  = require('../core/Task').Task
const props = require('./../App').props

const MensajePullerTask = new Task (
    {
      name: 'MensajePullerTask',
      every: 10000,
      inject: ["MensajeService","BluetoothService"],
      autoload: false,
      ready: false
    }
);

MensajePullerTask.initialize = function () {
  props.applicationEvent.on("action_AUTO_PULL_MENSAJES", (activate) => {
      this.ready = activate;
  })
}

MensajePullerTask.run = function () {
  this.ready = false
  this.MensajeService.getMensajes({}).then(res => {
    if (res) {
      props.applicationEvent.emit("webMessageReceived", res)
    }
    this.ready = true
  })
}

module.exports = MensajePullerTask;