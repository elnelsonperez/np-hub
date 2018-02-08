const util = require('util')
const EventEmitter = require('events').EventEmitter
const RequestQueueService = require("./../services/RequestQueueService")
/**
 *
 * @param {RequestQueueService} QueueService
 * @param {GprsService} GprsService
 * @constructor
 */
const RequestProcessorService =  function (QueueService, GprsService) {

  this.processNextPendingRequest = async () => {
    if (!GprsService.initialized) {
      throw new Error(RequestProcessorService.GPRS_NOT_INITIALIZED)
    } else {
      let request = await QueueService.getNextRequest()
      let failedRequest = await QueueService.getNextRequest(QueueService.STATUS_FAILED)

      if (!request && failedRequest) {
        return {pendingRequests: false}
      } else if (!request && !failedRequest) {
        return
      }

      let result = null;
      try {
        if (request.method === RequestQueueService.METHOD_GET) {
          result = await GprsService.httpGet(request.url, this.appendCreationDate(request.payload))
        } else if (request.method === RequestQueueService.METHOD_POST) {
          result = await GprsService.httpPost(request.url, this.appendCreationDate(request.payload))
        }

        if (result.code.startsWith("6")) {
          throw new Error("HTTPCODE6xx")
        } else {
          QueueService.changeStatus(request.id, RequestQueueService.STATUS_DONE)
          if (request.event_name) {
            this.emit(request.event_name, {error: null, res: result, id: request.id})
          }
        }

      }
      catch (e) {
        if (request.auto_discard && request.auto_discard !== 0) {
          QueueService.changeStatus(request.id, RequestQueueService.STATUS_NEVER)
        } else {
          QueueService.changeStatus(request.id, RequestQueueService.STATUS_FAILED)
        }
        if (request.event_name) {
          this.emit(request.event_name, {error: e, res: null, id: request.id})
        }
      }
    }
  }

  this.appendCreationDate = (payload) => {
    const obj = payload;
    obj.processed_on = + new Date()
    return obj
  }

  this.processNextFailedRequest = async () => {

    if (GprsService.initialized) {
      let request = await QueueService.getNextRequest(QueueService.STATUS_FAILED)
      let pendingRequest = await QueueService.getNextRequest();
      if (pendingRequest || !request) {
        return {pendingRequests: true}
      }
      let result = null;
      try {
        if (request.method === RequestQueueService.METHOD_GET) {
          result = await GprsService.httpGet(request.url, this.appendCreationDate(request.payload))
        } else if (request.method === RequestQueueService.METHOD_POST) {
          result = await GprsService.httpPost(request.url, this.appendCreationDate(request.payload))
        }

        if (result.code.startsWith("6")) {
          throw new Error("HTTPCODE6xx")
        } else {
          QueueService.changeStatus(request.id, RequestQueueService.STATUS_DONE)
          if (request.event_name) {
            this.emit(request.event_name, {error: null, res: result, id: request.id})
          }
        }

      }
      catch (e) {
        if (QueueService.getRetryCount(request.id) >= 3) {
          QueueService.changeStatus(request.id, RequestQueueService.STATUS_NEVER)
        } else {
          QueueService.incrementRetryCounter(request.id)
        }
        if (request.event_name) {
          this.emit(request.event_name, {error: e, res: null, id: request.id})
        }
      }
    } else {
      throw new Error(RequestProcessorService.GPRS_NOT_INITIALIZED)
    }
  }
}

RequestProcessorService.GPRS_NOT_INITIALIZED = 100;

util.inherits(RequestProcessorService, EventEmitter)
module.exports = RequestProcessorService;
