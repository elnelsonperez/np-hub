const Task  = require('../core/Task').Task
const props = require('./../App').props

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
    // console.log("============================= RESPONSE PENDING REQUEST",resp)
    if (resp && resp.doFailed === true) {
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
    // console.log("============================= RESPONSE FAILED REQUEST",resp)
    if (resp && resp.doPending === true) {
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
  props.applicationEvent.on("boot.ready", () => {
    this.ready = true;
  })
}

RequestQueueTask.run = function () {
  if (this.ready === true) {
    this.ready = false
    this.doPending()
  }
}

module.exports = RequestQueueTask;