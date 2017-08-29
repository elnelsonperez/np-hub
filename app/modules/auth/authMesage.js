const ApplicationModule  = require('../../core/module').ApplicationModule

const appModule = new ApplicationModule (
    {
      name : 'authMessage',
      start : 0,
      end : 19,
      line : 4,
      scrolling: true,
      dependsOn: ['auth']
    }
);

appModule.view = function () {
  if (this.parentModules.auth.msg) {
    return this.parentModules.auth.msg;
  } else
      return '';
}

module.exports = appModule;