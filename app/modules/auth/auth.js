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
      setTimeout( () => {
          this.publicProperties.users = [
              {
                  id: 25,
                  name: 'Jose Maria',
                  ibutton: '01-00000174dd83'
              },
              {
                  id: 25,
                  name: 'Nelson Lewis',
                  ibutton: '01-0000016be680'
              },
          ];

          this.data.msg = '\x04Utilice su IButton'

          const waitForAuth = () => {
              this.IbuttonReader.read().then((val) => {
                  const user = this.publicProperties.users.find(function (user) {
                      return user.ibutton === val;
                  })
                  console.log('user', user)
                  if (user) {
                      this.data.msg = 'Bienvenido, '+user.name.split(' ')[0]
                  }
                  else {
                      this.data.msg = 'Intentelo de Nuevo';
                      waitForAuth();
                  }


              }).catch(err => {
                  console.log(err)
                  if ((typeof err) === 'string') {
                      this.data.msg = err
                  } else {
                      this.data.msg = 'Error Inesperado';
                  }
              })
          }
          waitForAuth();

      }, 1000)


    // this.GprsManager.httpGet('http://nppms.us/api/getAsignedUsers/'+encodeURIComponent(this.publicProperties.serial)).then( (res) => {
    //   if (res.code === '200') {
    //     this.publicProperties.users = res;
    //   } else {
    //     this.data.msg = 'Error al obtener usuarios asignados'
    //   }
    // }).catch(e => console.log(e))

  }

}

appModule.view = function () {
  return 'Autenticacion'
}

appModule.controller = function () {
  return this.view();
}

module.exports = appModule;