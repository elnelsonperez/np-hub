const util = require('util')
const EventEmitter = require('events').EventEmitter
const QueueService = require("./RequestQueueService")
/**
 *
 * @param {RequestSenderService} RequestSenderService
 * @param configEndpoint
 * @constructor
 */
const ConfigService = function (RequestSenderService, configEndpoint) {
  this.eventName = "CONFIG_REQUEST"

  this.getDeviceConfiguration = async function () {
    let configuration = null
    try {
      console.log("Requesting Device Configuration");
      const response  = await RequestSenderService.requestWithResponse({
        url: configEndpoint,
        method: "POST",
        priority: QueueService.PRIORITY_MOST,
        event_name: this.eventName
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