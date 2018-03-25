const util = require('util')
const EventEmitter = require('events').EventEmitter
const QueueService = require("./RequestQueueService")
/**
 * Se encarga de descargar y enviar mensajes al servidor utilizando el RequestSenderService.
 * @param {RequestSenderService} RequestSenderService
 */
const MensajeService = function (RequestSenderService) {

  this.getMensajes = async function ({today = false, from = false, to = false,
                                       paginateUrl = "http://nppms.us/api/hub_get_mensajes"}) {
    const response  = await RequestSenderService.requestWithResponse({
      url: paginateUrl,
      method: "POST",
      timeout: 20000,
      priority: QueueService.PRIORITY_MEDIUM,
      event_name: "MENSAJES_GET",
      payload: {
        today,
        from,
        to
      }
    })
    if (response.code === 200) {
      return response.content;
    }
    if (response.code === 204) {
      return null;
    }
  }

  this.sendMessage = async function ({oficial_unidad_id, contenido}) {
    const response  = await RequestSenderService.requestWithResponse({
      url: "http://nppms.us/api/hub_mensajes",
      method: "POST",
      priority: QueueService.PRIORITY_MEDIUM,
      event_name: "MENSAJES_SENT",
      payload: {oficial_unidad_id, contenido}
    })
    if (response.code === 201) {
      return response.content;
    }
    return null
  }

  this.updateMessagesStatus = async function ({mensajes_ids, estado_id}) {
    const response  = await RequestSenderService.requestWithResponse({
      url: "http://nppms.us/api/hub_estado_mensajes",
      method: "POST",
      priority: QueueService.PRIORITY_MEDIUM,
      event_name: "MENSAJE_ESTADO",
      payload: {mensajes_ids, estado_id}
    })
    if (response.code === 200) {
      return response.content;
    }
    return null
  }
}

util.inherits(MensajeService, EventEmitter)
module.exports = MensajeService;