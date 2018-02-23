const util = require('util')
const EventEmitter = require('events').EventEmitter
const QueueService = require("./RequestQueueService")
/**
 * @param {RequestSenderService} RequestSenderService
 */
const DataPullingService = function (RequestSenderService) {

  this.getHubData = async function (
      {
        mensajes = {today: false, from: false, to: false},
        incidencias = {}
      }
  ) {
    try {
      const response  = await RequestSenderService.requestWithResponse({
        url: "http://nppms.us/api/hub_get_data",
        method: "POST",
        priority: QueueService.PRIORITY_MEDIUM,
        event_name: "DATA_PULL_GET",
        payload: {
          mensajes,
          incidencias
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

util.inherits(DataPullingService, EventEmitter)
module.exports = DataPullingService;