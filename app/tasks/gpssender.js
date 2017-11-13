const Task  = require('./../core/task').Task

const GpsSenderTask = new Task (
    {
        name: 'GpsSenderTask',
        data: {

        },
        every: 8000,
        inject: ['GprsManager']
    }
);

GpsSenderTask.run = function () {
    if (this.ready === true) {
        this.ready = false;
        this.siblingTasks.GpsTask.getNextLocations(1).then((locs) => {
           res =   this.GprsManager.httpPost('http://nppms.us/api/locations/new/'+this.publicProperties.serial,
                {
                    locations:locs
                }
            ).then((res) => {
               console.log(this.appEvent)
               this.publicProperties.appEvent.emit('locationSent');
               console.log(res)
           })

            this.ready = true;
        })
    }

}
module.exports = GpsSenderTask;