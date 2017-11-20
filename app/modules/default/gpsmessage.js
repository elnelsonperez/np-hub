
const ApplicationModule  = require('../../core/module').ApplicationModule

const appModule = new ApplicationModule (
    {
      name : 'gpsmessage',
      start : 0,
      end : 19,
      line : 4,
      scrolling: true,
      data: {
        location: null,
         count: 0
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
    this.GpsSenderTask.on('locationSent', (res) => {
        this.data.count++;
        console.log('eventoccured',res)
    })
  }
  return this.view();
};
appModule.view = function () {
  if (this.data.location === null) {
    return "..."
  } else {
      return "Locs Enviadas: "+this.data.count
  }
};

module.exports = appModule;