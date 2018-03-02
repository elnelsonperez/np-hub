const Task  = require('../core/Task').Task
const props = require('./../App').props

const DataPullerTask = new Task (
    {
      name: 'DataPullerTask',
      every: 4000,
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
      this.pullMensajes(bridgeData.pullingData.lastPulledMessageDate)
          .catch(e => {
            console.log(e)
          })
          .finally(() => {
            this.pullIncidencias(bridgeData.pullingData.lastPulledIncidenciaDate)
                .catch(e => {
                  console.log(e)
                })
                .finally(() => {
                  this.ready = true;
                })
          })
    }
  }
}

DataPullerTask.pullMensajes = function (lastDate, paginateUrl = null) {
  return new Promise(resolve => {
    let params =  {from: lastDate ? lastDate : false};
    if (paginateUrl !== null) {
      params = {from: lastDate ? lastDate : false, paginateUrl: paginateUrl}
    }
    this.MensajeService.getMensajes(params).then(pagination => {
      if (pagination && pagination.data) {
        props.applicationEvent.emit("autopulledMessages", pagination.data)
      }
      if (pagination && pagination.next_page_url !== null) {
        this.pullMensajes(null, pagination.next_page_url).finally(() => {
          this.errorsClear()
          resolve()
        })
      }
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