const util = require('util')
const EventEmitter = require('events').EventEmitter
const QueueService = require("./RequestQueueService")
/**
 * Se encarga de descargar y enviar incidentes al servidor utilizando el RequestSenderService.
 * @param {RequestSenderService} RequestSenderService
 */
const IncidenciaService = function (RequestSenderService) {

  this.getIncidencias = async function ({from = false}) {

    const response  = await RequestSenderService.requestWithResponse({
      url: "http://nppms.us/api/hub_get_incidencias",
      method: "POST",
      priority: QueueService.PRIORITY_MEDIUM,
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

  //Ids in DB
  this.updateIncidenciaStatus = async function ({estado_id, incidencia_id}) {
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
}

IncidenciaService.RECIBIDA = 1;
IncidenciaService.ABIERTA = 2;
IncidenciaService.ASIGNADA = 3;
IncidenciaService.EN_CURSO = 4;
IncidenciaService.CANCELADA = 5;
IncidenciaService.RESUELTA = 6;

util.inherits(IncidenciaService, EventEmitter)
module.exports = IncidenciaService;