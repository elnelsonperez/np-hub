const ApplicationModule  = require('../../core/Module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'authMessage2',
        start : 0,
        end : 19,
        line : 2,
        scrolling: false
    }
);

appModule.view = function () {
  return 'Autenticacion Test';
}

module.exports = appModule;