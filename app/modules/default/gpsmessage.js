
const ApplicationModule  = require('../../core/Module').ApplicationModule

const appModule = new ApplicationModule (
    {
      name : 'gpsmessage',
      start : 0,
      end : 19,
      line : 3,
      scrolling: true,
      data: {
         count: 0,
         lastLocation: null
      },
        inject: [
            {
             type: 'task',
             name: 'GpsSenderTask'
            }
        ]
    }
);

appModule.controller = function () {
  if (this.ready === true) {
    this.ready = false;
    this.GpsSenderTask.on('locationSent', (locations) => {
        this.data.count++;
        this.data.lastLocations = locations;
        console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        console.log(locations);
    })
  }
  return this.view();
};
appModule.view = function () {
  if (this.data.lastLocation === null) {
    return "Obteniendo..."
  } else {
      return "Loc #"+this.data.lastLocation.id+' enviada';
  }
};

module.exports = appModule;