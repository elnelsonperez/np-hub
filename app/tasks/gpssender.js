const Task  = require('../core/Task').Task

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
        if (this.GprsManager.initialized) {
            this.ready = false
            this.siblingTasks.GpsTask.getNextLocations(1).then((locs) => {
                console.log('********** LOCATION TO SEND ************')
                console.log(locs)
                res = this.GprsManager.httpPost('http://nppms.us/api/locations/new/'+this.props.serial,
                    {
                        locations: locs
                    }
                ).then((res) => {
                    if (parseInt(res.code) === 200)
                        this.emit('locationSent', res.content);
                })
                this.ready = true;
            })
        }
    }

}
module.exports = GpsSenderTask;