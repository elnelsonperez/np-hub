const Task  = require('../core/Task').Task
const RequestQueueService = require ("./../../app/services/RequestQueueService")
const GpsSenderTask = new Task (
    {
      name: 'GpsSenderTask',
      every: 5000, //5 Segundos
      inject: ['RequestQueueService', 'RequestProcessorService']
    }
);

GpsSenderTask.run = function () {
  if (this.ready === true) {
    this.ready = false
    const eventName = "locationSent"
    this.siblingTasks.GpsTask.getNextLocations(5).then((locs) => {
      this.RequestQueueService.insertRequest({
        url: 'http://nppms.us/api/locations/new/'+this.props.serial,
        method: RequestQueueService.METHOD_POST,
        payload: JSON.stringify({
          locations: locs
        }),
        priority: RequestQueueService.PRIORITY_MEDIUM,
        event_name: eventName
      })
      this.ready = true;
    })

  }

}
module.exports = GpsSenderTask;