const Task  = require('../core/Task').Task
const RequestQueueService = require ("./../../app/services/RequestQueueService")
const props = require('./../App').props

/**
 * Se encarga de enviar las localizaciones validadas por el hermano GpsTask al servidor
 * periodicamente
 * @type {Task}
 */
const GpsSenderTask = new Task (
    {
      name: 'GpsSenderTask',
      every: 5000, //5 Segundos
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
    this.siblingTasks.GpsTask.getNextLocations(1).then((locs) => {
      this.RequestQueueService.addRequest({
        url: 'http://nppms.us/api/hub_localizaciones',
        method: RequestQueueService.METHOD_POST,
        payload: {
          locations: locs
        },
        priority: RequestQueueService.PRIORITY_MEDIUM,
        event_name: eventName
      })
      res()
    })
  })
}

module.exports = GpsSenderTask;