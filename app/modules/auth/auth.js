const ApplicationModule  = require('../../core/module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'auth',
        start : 0,
        end : 19,
        line : 3,
        scrolling: false,
        inject: ['IbuttonReader', 'GprsManager']
    }
);


appModule.initialize = function () {
  if (!this.publicProperties.users) {
    this.GprsManager.httpGet('http://nppms.us/api/getAsignedUsers/'+this.publicProperties.serial).then(function (res) {

    }).catch(e => console.log(e))
  }
}

appModule.view = function (msg) {
    if (this.data.msg)
        return this.data.msg
    else
        return msg;
}

appModule.controller = function () {

  this.IbuttonReader.read().then(function (id) {
    this.publicProperties.
  }).catch(e => console.log(e))

  this.appEvent.emit('auth.ready')
  return this.view('---');

}

module.exports = appModule;