const Task  = require('../core/Task').Task
const props = require('./../shared/props')

const DataPullerTask = new Task (
    {
      name: 'DataPullerTask',
      every: 500,
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
  return new Promise(res => {
    const bridgeData = props.bridge
    if (Object.keys(bridgeData.connectedMacAddresses).length > 0) {
      // console.log ("==================> lastPulledMessageDate", bridgeData.pullingData.lastPulledMessageDate)
      // console.log ("==================> lastPulledIncidenciaDate", bridgeData.pullingData.lastPulledIncidenciaDate)
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
                  res()
                })
          })
    } else {
      res()
    }
  })
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

      if (Object.keys(props.bridge.connectedMacAddresses).length > 0 &&
          pagination &&
          pagination.next_page_url !== null) {
        this.pullMensajes(lastDate, pagination.next_page_url).finally(() => {
          this.errorsClear()
          resolve()
        })
      } else {
        this.errorsClear()
        resolve()
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