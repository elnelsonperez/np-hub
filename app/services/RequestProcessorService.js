const util = require('util')
const EventEmitter = require('events').EventEmitter
const RequestQueueService = require("./../services/RequestQueueService")
const getSerial = require('./../../lib/systeminfo').getSerial
/**
 *
 * @param {RequestQueueService} QueueService
 * @param {GprsService} GprsService
 * @constructor
 */
const RequestProcessorService =  function (QueueService, GprsService) {
  this.serial = getSerial()

  this.processNextPendingRequest = async () => {
    if (!GprsService.initialized) {
      throw new Error(RequestProcessorService.GPRS_NOT_INITIALIZED)
    } else {
      let request = await QueueService.getNextRequest()
      let failedRequest = await QueueService.getNextRequest(RequestQueueService.STATUS_FAILED)

      if (!request && failedRequest) {
        return {doFailed: true}
      } else if (!request && !failedRequest) {
        return;
      }

      let result = null;
      try {
        if (request.method === RequestQueueService.METHOD_GET) {
          result = await GprsService.httpGet(request.url, this.appendExtraData(request.payload))
        } else if (request.method === RequestQueueService.METHOD_POST) {
          result = await GprsService.httpPost(request.url, this.appendExtraData(request.payload))
        }

        if (result.code.toString().startsWith("6")) {
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

  this.appendExtraData = (payload) => {
    let realPayload = Object.assign({}, payload)
    realPayload.hub_serial = this.serial
    realPayload.processed_on = + new Date()
    return realPayload
  }

  this.processNextFailedRequest = async () => {

    if (GprsService.initialized) {
      let request = await QueueService.getNextRequest(RequestQueueService.STATUS_FAILED)
      let pendingRequest = await QueueService.getNextRequest(RequestQueueService.STATUS_PENDING);
      if (pendingRequest || !request) {
        return {doPending: true}
      }
      let result = null;
      try {
        if (request.method === RequestQueueService.METHOD_GET) {
          result = await GprsService.httpGet(request.url, this.appendExtraData(request.payload))
        } else if (request.method === RequestQueueService.METHOD_POST) {
          result = await GprsService.httpPost(request.url, this.appendExtraData(request.payload))
        }

        if (result.code.toString().startsWith("6")) {
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

RequestProcessorService.GPRS_NOT_INITIALIZED = "El modulo GPRS no esta activo";

util.inherits(RequestProcessorService, EventEmitter)
module.exports = RequestProcessorService;
