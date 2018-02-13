const Task  = require('../core/Task').Task
const RequestQueueService = require ("./../../app/services/RequestQueueService")
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
  this.props.applicationEvent.on("boot.ready", () => {
    this.ready = true;
  })
}

GpsSenderTask.run = function () {
  if (this.ready === true) {
    this.ready = false
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
      this.ready = true;
    })
  }
}

module.exports = GpsSenderTask;