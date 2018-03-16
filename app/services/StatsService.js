const util = require('util')
const EventEmitter = require('events').EventEmitter
const QueueService = require("./RequestQueueService")

/**
 * @param {RequestSenderService} RequestSenderService
 */
const StatsService = function (RequestSenderService) {

  this.getStats = async function ({sector_id = null}) {

    const response  = await RequestSenderService.requestWithResponse({
      url: "http://nppms.us/api/hub_stats",
      method: "POST",
      priority: QueueService.PRIORITY_MEDIUM,
      event_name: "STATS_GET",
      payload: {
        sector_id
      }
    })
    if (response.code === 200) {
      return response.content;
    }
    if (response.code === 204) {
      return null;
    }

  }

}

util.inherits(StatsService, EventEmitter)
module.exports = StatsService;