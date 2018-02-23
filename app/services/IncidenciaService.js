const util = require('util')
const EventEmitter = require('events').EventEmitter
const QueueService = require("./RequestQueueService")
/**
 * @param {RequestSenderService} RequestSenderService
 */
const IncidenciaService = function (RequestSenderService) {

  this.getIncidencias = async function ({from = false}) {
    try {
      const response  = await RequestSenderService.requestWithResponse({
        url: "http://nppms.us/api/hub_get_incidencias",
        method: "POST",
        priority: QueueService.PRIORITY_HIGH,
        event_name: "INCIDENCIAS_GET",
        payload: {
          from
        }
      })
      if (response.code === 200) {
        return response.content;
      }
      if (response.code === 204) {
        return null;
      }
    }
    catch (e) {
      console.log(e)
      if (!e.code || e.code !== 800) {
        this.emit("error_message", e.message)
      }
    }
  }

  //Ids in DB
  this.changeStatus = async function ({estado_id = 4, incidencia_id}) {
    try {
      const response  = await RequestSenderService.requestWithResponse({
        url: "http://nppms.us/api/hub_estado_incidencias",
        method: "POST",
        priority: QueueService.PRIORITY_HIGH,
        event_name: "INCIDENCIA_ESTADO",
        payload: {
          estado_id,
          incidencia_id
        }
      })
      if (response.code === 200) {
        return response.content;
      }
    }
    catch (e) {
      console.log(e)
      if (!e.code || e.code !== 800) {
        this.emit("error_message", e.message)
      }
    }
  }
}

IncidenciaService.RECIBIDA = 1;
IncidenciaService.ABIERTA = 2;
IncidenciaService.ASIGNADA = 3;
IncidenciaService.EN_CURSO = 4;
IncidenciaService.CANCELADA = 5;
IncidenciaService.RESUELTA = 6;

util.inherits(IncidenciaService, EventEmitter)
module.exports = IncidenciaService;