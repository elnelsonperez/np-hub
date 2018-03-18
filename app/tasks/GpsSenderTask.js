const Task  = require('../core/Task').Task
const RequestQueueService = require ("./../../app/services/RequestQueueService")
const props = require('./../shared/props')

/**
 * Se encarga de enviar las localizaciones validadas por el hermano GpsTask al servidor
 * periodicamente
 * @type {Task}
 */
const GpsSenderTask = new Task (
    {
      name: 'GpsSenderTask',
      every: 2000, //5 Segundos
      inject: ['RequestQueueService', 'RequestProcessorService'],
      autoload: false,
      ready: false
    }
);

GpsSenderTask.initialize = function () {
  props.applicationEvent.on("config.ready", () => {
    this.ready = true;
  })
}

GpsSenderTask.run = function () {
  return new Promise(res => {
    const eventName = "locationSent"
    this.siblingTasks.GpsTask.getNextLocations().then((locs) => {
      this.RequestQueueService.addRequest({
        url: 'http://nppms.us/api/hub_localizaciones',
        method: RequestQueueService.METHOD_POST,
        payload: {
          locations: locs
        },
        priority: RequestQueueService.PRIORITY_MOST,
        event_name: eventName
      })
    }).finally(() => {
      res()
    })
  })
}

module.exports = GpsSenderTask;