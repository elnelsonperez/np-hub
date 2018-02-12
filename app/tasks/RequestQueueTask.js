const Task  = require('../core/Task').Task

const RequestQueueTask = new Task (
    {
      name: 'RequestQueueTask',
      inject: ['RequestProcessorService','GprsService'],
      autoload: false,
      ready: false,
      every: 1500
    }
);

RequestQueueTask.doPending = async function () {
  try {
    const resp = await this.RequestProcessorService.processNextPendingRequest()
    if (resp && resp.pendingRequests === false) {
      await this.doFailed()
    } else {
      this.ready = true;
    }
  }
  catch (e) {
    console.log(e.message)
    this.ready = true;
  }

}

RequestQueueTask.doFailed = async function () {
  try {
    const resp = await this.RequestProcessorService.processNextFailedRequest()
    if (resp && resp.pendingRequests === true) {
      await this.doPending()
    } else {
      this.ready = true;
    }
  }
  catch (e) {
    console.log(e.message)
    this.ready = true;
  }

}

RequestQueueTask.initialize = function () {
  this.props.applicationEvent.on("boot.ready", () => {
    this.ready = true;
  })
}

RequestQueueTask.run = function () {
  console.log("=== Request Queue Task Ran ===")
  if (this.ready === true) {
    this.ready = false
    this.doPending()
  }
}

module.exports = RequestQueueTask;