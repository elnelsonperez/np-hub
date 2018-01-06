const ApplicationModule  = require('../../app/core/Module').ApplicationModule

const appModule = new ApplicationModule (
    {
      name : 'authMessage',
      start : 0,
      end : 19,
      line : 4,
      scrolling: true,
      dependsOn: 'auth'
    }
);

appModule.view = function () {
  if (this.parentModule.data.msg) {
    return this.parentModule.data.msg;
  } else
      return '';
}

module.exports = appModule;