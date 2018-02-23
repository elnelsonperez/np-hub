const Task  = require('../core/Task').Task
const props = require('./../App').props

const DataPullerTask = new Task (
    {
      name: 'DataPullerTask',
      every: 5000,
      inject: ["MensajeService","BluetoothService", "IncidenciaService"],
      autoload: true,
      ready: true
    }
);

DataPullerTask.run = function () {
  if (this.ready) {
    const bridgeData = this.siblingTasks.BluetoothBridgeTask.data;
    if (Object.keys(bridgeData.connectedMacAddresses).length > 0) {
      console.log ("==================> lastPulledMessageDate", bridgeData.pullingData.lastPulledMessageDate)
      console.log ("==================> lastPulledIncidenciaDate", bridgeData.pullingData.lastPulledIncidenciaDate)
      this.pullIncidencias(bridgeData.pullingData.lastPulledIncidenciaDate)
      this.pullMensajes(bridgeData.pullingData.lastPulledMessageDate)
    }
  }
}

DataPullerTask.pullMensajes = function (lastDate) {
  this.ready = false
  this.MensajeService.getMensajes({from: lastDate ? lastDate : false}).then(res => {
    if (res) {
      props.applicationEvent.emit("autopulledMessages", res)
    }
    this.ready = true
  })
}

DataPullerTask.pullIncidencias = function (lastDate) {
  this.ready = false
  this.IncidenciaService.getMensajes({from: lastDate ? lastDate : false}).then(res => {
    if (res) {
      props.applicationEvent.emit("autopulledIncidencias", res)
    }
    this.ready = true
  })
}

module.exports = DataPullerTask;