const util = require('util')
const EventEmitter = require('events').EventEmitter
/**
 * Se encarga de traer las configuraciones del servidor.
 * @param {RequestSenderService} RequestSenderService
 * @param {RequestQueueService} QueueService
 * @param configEndpoint
 * @constructor
 */
const ConfigService = function (RequestSenderService, QueueService, configEndpoint) {
  this.eventName = "CONFIG_REQUEST"

  this.getDeviceConfiguration = async function () {
    let configuration = null
    try {
      QueueService.clearRequestsByEventName(this.eventName)
      const response  = await RequestSenderService.requestWithResponse({
        url: configEndpoint,
        method: "POST",
        priority: QueueService.PRIORITY_MOST,
        event_name: this.eventName,
        payload: {
          force: true
        }
      })
      if (response.code !== 200) {
        this.emit("Config request failed", response.code)
        return null;
      }
      else {
        configuration = response.content;
      }
    }
    catch (e) {
      console.log(e)
      if (!e.code || e.code !== 800) {
        this.emit("error_message", e.message)
      }
    }
    return configuration
  }
}

util.inherits(ConfigService, EventEmitter)
module.exports = ConfigService;