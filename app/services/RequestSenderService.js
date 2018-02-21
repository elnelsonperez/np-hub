const QueueService = require("./RequestQueueService")

/**
 * @param {RequestQueueService} RequestQueueService
 * @param {RequestProcessorService} RequestProcessorService
 * @constructor
 */
const RequestSenderService = function (RequestQueueService, RequestProcessorService) {

  this.requestWithResponse = (
      {url, method, payload, priority = QueueService.PRIORITY_LOW, event_name = null, timeout= 15000}) => {
    return new Promise((res,rej) => {
      RequestQueueService.addRequest({
        url: url,
        method: method,
        event_name: event_name,
        priority: priority,
        payload: payload,
        auto_discard: true
      }).then((requestId) => {
        const timeoutId = setTimeout(() => {
          const error = new Error("Timeout for request reached")
          error.code = 800
          rej(error)
        }, timeout)

        const callback =  (response) => {
          if (response.error) {
            RequestProcessorService.removeListener(event_name,callback)
            rej(response.error)
          }

          if (response.id && response.id === requestId) {
            clearTimeout(timeoutId)
            RequestProcessorService.removeListener(event_name,callback)
            res(response.res)
          }
        };
        RequestProcessorService.on(event_name,callback)
      }).catch(e => {
        RequestProcessorService.removeListener(event_name,callback)
        rej(e)
      })

    })

  }

}

module.exports = RequestSenderService