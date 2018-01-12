const util = require('util')
const EventEmitter = require('events').EventEmitter
const QueueService = require("./RequestQueueService")
/**
 *
 * @param {RequestSenderService} RequestSenderService
 * @param configEndpoint
 * @constructor
 */
const ConfigService = function ({RequestSenderService, configEndpoint}) {
  this.eventName = "CONFIG_REQUEST"
  /**
   * @param {String} serialNumber
   */
  this.getDeviceConfiguration = async function (serialNumber) {
    let configuration = null
    while (!configuration) {
      try {
        const response = await RequestSenderService.requestWithResponse({
          url: configEndpoint+"/"+serialNumber,
          method: "GET",
          priority: QueueService.PRIORITY_MOST,
          event_name: "CONFIG_REQUEST"
        })
        //TODO actually return the config object
        configuration = JSON.parse(response);
      }
      catch (e) {
        if (!e.code || e.code !== 800) {
          this.emit("error_message", e.messagee)
        }
      }
    }
    return configuration
  }
}

util.inherits(ConfigService, EventEmitter)
module.exports = ConfigService;