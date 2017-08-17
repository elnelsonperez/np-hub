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

appModule.prototype.initialize = function () {

    this.GprsManager.on('message', (msg) => {
        this.data.msg = msg;
    })

    this.GprsManager.initialize()
}

appModule.prototype.view = function (msg) {
    if (this.data.msg)
        return this.data.msg
    else
        return msg;
}

appModule.prototype.controller = function () {
    return this.view('Cargando Modulos')
}

module.exports = appModule;