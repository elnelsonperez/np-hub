const ApplicationModule  = require('../../core/module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'moduleLoader',
        start : 0,
        end : 19,
        line : 3,
        scrolling: false,
        inject: ['GprsManager']
    }

);

appModule.initialize = async function () {

    this.GprsManager.on('message', (msg) => {
        this.data.msg = msg;
    })

    try {
        await this.GprsManager.initialize()
        this.data.msg = "Modulos Listos"
        this.publicProperties.appEvent.emit('boot.ready')
    }catch (e) {console.log(e)}

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