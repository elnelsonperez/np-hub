const Task  = require('../core/Task').Task
const props = require('./../shared/props')

/**
 * Se encarga de periodicamente mandar a procesar los requests pendientes
 * en el queue;
 * @type {Task}
 */
const RequestProcessorTask = new Task (
    {
      name: 'RequestProcessorTask',
      inject: ['RequestProcessorService','GprsService'],
      autoload: false,
      ready: false,
      every: 500
    }
);

RequestProcessorTask.doPending = async function () {
  try {
    const resp = await this.RequestProcessorService.processNextPendingRequest()
    // console.log("============================= RESPONSE PENDING REQUEST",resp)
    if (resp && resp.doFailed === true) {
      await this.doFailed()
    }
  }
  catch (e) {
    console.log(e.message)
  }

}

RequestProcessorTask.doFailed = async function () {
  try {
    const resp = await this.RequestProcessorService.processNextFailedRequest()
    // console.log("============================= RESPONSE FAILED REQUEST",resp)
    if (resp && resp.doPending === true) {
      await this.doPending()
    }
  }
  catch (e) {
    console.log(e.message)
  }

}

RequestProcessorTask.initialize = function () {
  props.applicationEvent.on("boot.ready", () => {
    this.ready = true;
  })
}

RequestProcessorTask.run = async function () {
  await this.doPending()
}

module.exports = RequestProcessorTask;