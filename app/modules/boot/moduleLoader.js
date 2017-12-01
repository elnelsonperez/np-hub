const ApplicationModule  = require('../../core/Module').ApplicationModule
const delay = require('../../../lib/functions').delay;
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

    let done = false;
    while (done === false) {
        try {
            res = await this.GprsManager.initialize()
            done = res;
            if (done === false)
                this.data.msg = "Fail. Reintentando"
           await delay(1800);
        }catch (e) {console.log(e)}
    }

    this.data.msg = "Modulos Listos"
    this.props.appEvent.emit('boot.ready')
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