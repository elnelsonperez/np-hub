const ApplicationModule  = require('../../core/module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'auth',
        start : 0,
        end : 19,
        line : 2,
        scrolling: false,
        inject: ['IbuttonReader', 'GprsManager']
    }
);


appModule.initialize = function () {

  if (!this.publicProperties.users) {
    this.data.msg = 'Obteniendo usuarios'
    this.GprsManager.httpGet('http://nppms.us/api/getAsignedUsers/'+this.publicProperties.serial).then( (res) => {
      if (res.code === '200') {
        this.publicProperties.users = res;
      } else {
        this.data.msg = 'Error al obtener usuarios asignados'
      }
    }).catch(e => console.log(e))
  }

}

appModule.view = function () {
  return 'Autenticacion'
}

appModule.controller = function () {
  return this.view();
}

module.exports = appModule;