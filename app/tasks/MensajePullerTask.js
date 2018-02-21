const Task  = require('../core/Task').Task
const props = require('./../App').props

const MensajePullerTask = new Task (
    {
      name: 'MensajePullerTask',
      every: 8000,
      inject: ["MensajeService","BluetoothService"],
      autoload: true,
      ready: true
    }
);

MensajePullerTask.run = function () {

  const toPull = this.siblingTasks.BluetoothBridgeTask.data.pullingData
  if (Object.keys(toPull).length > 0) {
    this.ready = false
    for (let mac of Object.keys(toPull)) {
      const lastDate = toPull[mac].lastPulledMessageDate
      console.log ("==================> lastPulledMessageDate", lastDate)
      if (lastDate) {
        this.MensajeService.getMensajes({from: lastDate}).then(res => {
          if (res) {
            props.applicationEvent.emit("autopulledMessages", {mac, mensajes: res})
          }
          this.ready = true
        })
      } else {
        this.MensajeService.getMensajes({today: true}).then(res => {
          if (res) {
            props.applicationEvent.emit("autopulledMessages", {mac,mensajes: res})
          }
          this.ready = true
        })
      }
    }
  }

}

module.exports = MensajePullerTask;