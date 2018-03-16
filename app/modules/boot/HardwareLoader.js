const ApplicationModule  = require('../../core/Module').ApplicationModule
const props = require('./../../shared/props')

const appModule = new ApplicationModule (
    {
      name : 'HardWareLoader',
      start : 0,
      end : 19,
      line : 3,
      scrolling: false
    }
);

appModule.initialize = async function () {
  this.ready = false;
  props.applicationEvent.on('hardwareLoader.message', msg => {
    this.data.msg = msg;
  })
}

appModule.view = function (msg) {
  if (this.data.msg)
    return this.data.msg
  else
    return msg;
}

appModule.controller = function () {
  return this.view('Cargando Modulos');
}

module.exports = appModule;