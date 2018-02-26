const Task  = require('../core/Task').Task
const props = require('./../App').props

const DataPullerTask = new Task (
    {
      name: 'DataPullerTask',
      every: 5000,
      inject: ["MensajeService","BluetoothService", "IncidenciaService"],
      autoload: false,
      ready: false
    }
);

DataPullerTask.initialize = function () {
  props.applicationEvent.on("config.ready", () => {
    this.ready = true;
  })
}

DataPullerTask.run = function () {
  if (this.ready) {
    const bridgeData = this.siblingTasks.BluetoothBridgeTask.data;
    if (Object.keys(bridgeData.connectedMacAddresses).length > 0) {
      console.log ("==================> lastPulledMessageDate", bridgeData.pullingData.lastPulledMessageDate)
      console.log ("==================> lastPulledIncidenciaDate", bridgeData.pullingData.lastPulledIncidenciaDate)
      this.ready = false;
     Promise.all([
        this.pullIncidencias(bridgeData.pullingData.lastPulledIncidenciaDate),
        this.pullMensajes(bridgeData.pullingData.lastPulledMessageDate)
      ]).then(() => {
        this.ready = true;
      }).catch(e => {
        this.ready = true;
      })
    }
  }
}

DataPullerTask.pullMensajes = function (lastDate) {
  return new Promise(resolve => {
    this.MensajeService.getMensajes({from: lastDate ? lastDate : false}).then(res => {
      if (res) {
        props.applicationEvent.emit("autopulledMessages", res)
      }
      this.errorsClear()
      resolve()
    }).catch(e => {
      console.log("Pulling messages error: ", e)
      this.errorsAdd()
      resolve()
    })
  })
}

DataPullerTask.pullIncidencias = function (lastDate) {
  return new Promise(resolve => {
    this.IncidenciaService.getIncidencias({from: lastDate ? lastDate : false}).then(res => {
      if (res) {
        props.applicationEvent.emit("autopulledIncidencias", res)
      }
      this.errorsClear()
      resolve()
    }).catch(e => {
      console.log("Pulling incidencias error: ", e)
      this.errorsAdd()
      resolve()
    })
  })

}

module.exports = DataPullerTask;