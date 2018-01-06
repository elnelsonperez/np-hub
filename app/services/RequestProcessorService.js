const util = require('util')
const EventEmitter = require('events').EventEmitter

/**
 *
 * @param {RequestQueueService} RequestQueueService
 * @param {GprsManager} GprsManager
 * @constructor
 */
const RequestProcessorService = function (RequestQueueService, GprsManager) {
  this.processNextPendingRequest = () => {
    return new Promise(resolve => {
      if (GprsManager.initialized) {
        let request = RequestQueueService.getNextRequest()
        let failedRequest = RequestQueueService.getNextRequest(RequestQueueService.STATUS_FAILED)

        if (!request && failedRequest) {
          resolve({pendingRequests: false})
        } else if (!request && !failedRequest) {
          resolve()
        }

        let promise = null;
        if (request.method === RequestQueueService.METHOD_GET) {
          promise = GprsManager.httpGet(request.url, request.payload)
        } else if (request.method === RequestQueueService.METHOD_POST) {
          promise = GprsManager.httpPost(request.url, request.payload)
        }
        promise.then((res)=> {
          RequestQueueService.changeStatus(request.id, RequestQueueService.STATUS_DONE)
          if (request.event_name) {
            this.emit(request.event_name, {error: null, res: res, id: request.id})
          }
          resolve()
        }).catch(e => {
          RequestQueueService.changeStatus(request.id, RequestQueueService.STATUS_FAILED)
          if (request.event_name) {
            this.emit(request.event_name, {error: e, res: null,id: request.id})
          }
          resolve()
        })
      }

    })
  }

  this.processNextFailedRequest = () => {
    return new Promise(resolve => {
      if (GprsManager.initialized) {
        let request = RequestQueueService.getNextRequest(RequestQueueService.STATUS_FAILED)
        let pendingRequest = RequestQueueService.getNextRequest();
        if (pendingRequest || !request) {
          resolve({pendingRequests: true})
        }
        let promise = null;
        if (request.method === RequestQueueService.METHOD_GET) {
          promise = GprsManager.httpGet(request.url, request.payload)
        } else if (request.method === RequestQueueService.METHOD_POST) {
          promise = GprsManager.httpPost(request.url, request.payload)
        }
        promise.then((res) => {
          RequestQueueService.changeStatus(request.id, RequestQueueService.STATUS_DONE)
          if (request.event_name) {
            this.emit(request.event_name, {error: null, res: res, id: request.id})
          }
          resolve()
        }).catch(e => {
          if (request.event_name) {
            this.emit(request.event_name, {error: e, res: null, id: request.id})
          }
          resolve()
        })
      }
    })
  }

}

util.inherits(RequestProcessorService, EventEmitter)
module.exports = RequestProcessorService;
