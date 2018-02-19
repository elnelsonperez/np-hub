const util = require('util')
const EventEmitter = require('events').EventEmitter
const QueueService = require("./RequestQueueService")
/**
 * @param {RequestSenderService} RequestSenderService
 */
const MensajeService = function (RequestSenderService) {

  this.getMensajes = async function ({today = false, from = false, to = false}) {
    try {
      console.log("Requesting Mensajes Pendientes");
      const response  = await RequestSenderService.requestWithResponse({
        url: "http://nppms.us/api/hub_get_mensajes",
        method: "POST",
        priority: QueueService.PRIORITY_MEDIUM,
        event_name: "MENSAJES_GET",
        payload: {
          today,
          from,
          to
        }
      })
      if (response.code === 200 || response.code === 204) {
        return response.content;
      }
    }
    catch (e) {
      console.log(e)
      if (!e.code || e.code !== 800) {
        this.emit("error_message", e.message)
      }
    }
    return null;
  }

  this.sendMensaje = async function ({oficial_unidad_id, contenido}) {
    try {
      console.log("Requesting Mensajes Pendientes");
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
    }
    catch (e) {
      console.log(e)
      if (!e.code || e.code !== 800) {
        this.emit("error_message", e.message)
      }
    }
    return null;
  }

}

util.inherits(MensajeService, EventEmitter)
module.exports = MensajeService;