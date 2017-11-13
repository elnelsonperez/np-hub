
const ApplicationModule  = require('../../core/module').ApplicationModule

const appModule = new ApplicationModule (
    {
      name : 'gpsmessage',
      start : 0,
      end : 19,
      line : 4,
      scrolling: true,
      inject: [{
        type: "task",
        name: "GpsTask"
      }],
      data: {
        location: null
      }
    }
);

appModule.controller = function () {
  if (this.ready === true) {
    this.ready = false;
   this.GpsTask.getNextLocations().then( (val) => {
      this.data.location = val[0];
      this.ready = true;
    })
  }
  return this.view();
};
appModule.view = function () {
  if (this.data.location === null) {
    return "Esperando"
  } else {
    return "Lt: "+parseFloat(this.data.location.lat).toFixed(7)+" Lg: "+parseFloat(this.data.location.lng).toFixed(7)
  }
};

module.exports = appModule;