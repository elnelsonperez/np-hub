const ApplicationModule  = require('../../core/Module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'auth',
        start : 0,
        end : 19,
        line : 1,
        scrolling: false,
        inject: ['IbuttonReader', 'GprsManager'],
        data: {
            authenticated: null
        }
    }
);


appModule.initialize = function () {
  setInterval(() => {

  },3000)

  if (!this.props.users) {
          this.data.msg = 'Obteniendo usuarios'

          this.GprsManager.httpGet(
              'http://nppms.us/api/getAsignedUsers/'+this.props.serial,null,30000).then( (res) => {
              if (res.code === '200') {
                  this.props.auth.users = res.content;
                  const showUseIbuttonMessage = () => {
                      this.data.msg = '\x04Utilice su IButton'
                  }

                  showUseIbuttonMessage();
                  this.data.authenticated = [];

                  const waitForAuth = () => {
                      this.IbuttonReader.read().then((val) => {
                          const user = this.props.auth.users.find(function (user) {
                              return user.ibutton === val;
                          })

                          if (user) {
                              if (this.props.auth.config.requireAll) {
                                  if (!this.data.authenticated.find(function (u) {
                                          return u.ibutton === user.ibutton;
                                      })
                                  ) {
                                      this.data.msg = 'Bienvenido, '+user.name.split(' ')[0]
                                      user.authenticated = true;
                                      this.data.authenticated.push(user)

                                      if (this.data.authenticated.length === this.props.auth.users.length) {
                                          this.props.app.emit('auth.ready')
                                      } else {
                                          setTimeout(showUseIbuttonMessage,1500)
                                          waitForAuth();
                                      }


                                  } else {
                                      this.data.msg = 'Ya esta autenticado'
                                      setTimeout(showUseIbuttonMessage,1500)
                                      waitForAuth();
                                  }
                              } else {
                                  this.data.msg = 'Bienvenido, '+user.name.split(' ')[0]
                                  user.authenticated = true;
                                  this.data.authenticated.push(user)
                                  setTimeout( () => {
                                      this.appEvent.emit('auth.ready')
                                  },1500)
                              }

                          } else {
                              this.data.msg = 'Intentelo de Nuevo';
                              setTimeout(showUseIbuttonMessage,2500)
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
              } else {
                  this.data.msg = 'Error al obtener usuarios asignados'
              }



          }).catch(e => console.log(e))

      }

}

//
// this.publicProperties.auth.users = [
//   {
//     id: 25,
//     name: 'Jose Maria',
//     ibutton: '01-00000174dd83',
//     authenticated: false
//   },
//   {
//     id: 25,
//     name: 'Nelson Lewis',
//     ibutton: '01-0000016be680',
//     authenticated: false
//   },
// ];
//


appModule.view = function () {
  return '\x04 NP PMS \x05'
}

appModule.controller = function () {
  return this.view();
}

module.exports = appModule;