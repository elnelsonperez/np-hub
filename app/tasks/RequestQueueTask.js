const Task  = require('../core/Task').Task

const RequestQueueTask = new Task (
    {
      name: 'RequestQueueTask',
      every: 1000, //5 Segundos
      inject: ['RequestProcessorService','GprsService'],
      autoload: true
    }
);

RequestQueueTask.doPending = function () {
  this.RequestProcessorService.processNextPendingRequest().then((a) => {
    if (a && a.pendingRequests === false) {
      this.doFailed()
    } else {
      this.ready = true;
    }
  })
}

RequestQueueTask.doFailed = function () {
  this.RequestProcessorService.processNextFailedRequest().then((a) => {
    if (a && a.pendingRequests === true) {
      this.doPending()
    } else {
      this.ready = true;
    }
  })
}

RequestQueueTask.run = function () {
  if (this.ready === true) {
    this.ready = false
    this.doPending()
  }
}

module.exports = RequestQueueTask;