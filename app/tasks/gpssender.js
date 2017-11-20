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
    this.emit('locationSent',1);
    console.log('EVENT EMITTED --------------------------------')
    if (this.ready === true) {
        this.ready = false;
        this.siblingTasks.GpsTask.getNextLocations(1).then((locs) => {
           res =   this.GprsManager.httpPost('http://nppms.us/api/locations/new/'+this.publicProperties.serial,
                {
                    locations:locs
                }
            ).then((res) => {
               this.emit('locationSent',res);
           })
            this.ready = true;
        })
    }

}
module.exports = GpsSenderTask;