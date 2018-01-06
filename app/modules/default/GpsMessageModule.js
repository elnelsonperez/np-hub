
const ApplicationModule  = require('../../core/Module').ApplicationModule

const appModule = new ApplicationModule (
    {
      name : 'gpsmessage',
      start : 0,
      end : 19,
      line : 3,
      scrolling: false,
      data: {
         count: 0,
         lastLocations: null
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
    })
  }
  return this.view();
};

appModule.view = function () {
  if (this.data.lastLocations === null) {
    return "Obteniendo..."
  } else {
      if (Array.isArray(this.data.lastLocations)) {
          cnt = this.data.lastLocations.reduce(function (ant,act) {
              if (ant === "") {
                  return ant+act.id;
              } else {
                  return ant+','+act.id;
              }
          },"");
          return "Loc #"+cnt+' enviada';
      } else {
        return "Error Recibiendo";
      }
  }
};

module.exports = appModule;