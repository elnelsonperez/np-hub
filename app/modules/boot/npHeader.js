const ApplicationModule  = require('../../core/Module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'npHeader',
        start : 0,
        end : 19,
        line : 1,
        scrolling: false,
    }
);

appModule.view = function () {
    return '\x04 NP PMS \x05';
}

module.exports = appModule;