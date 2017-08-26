const ApplicationModule  = require('../../core/module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'auth',
        start : 0,
        end : 19,
        line : 3,
        scrolling: false
    }
);

appModule.initialize = async function () {

    // this.GprsManager.on('failed', (msg) => {
    //     this.data.msg = msg;
    // })
    //
    // await this.GprsManager.initialize()
    //
    // this.data.msg = "Modulos Listos"

    this.appEvent.emit('auth.ready')

}

appModule.view = function (msg) {
    if (this.data.msg)
        return this.data.msg
    else
        return msg;
}

appModule.controller = function () {
    return this.view('---');
}

module.exports = appModule;