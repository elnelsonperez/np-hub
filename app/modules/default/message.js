
const ApplicationModule  = require('../../core/module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'message',
        start : 0,
        end : 19,
        line : 3,
        scrolling: true
    }
);

appModule.view = function () {
    return "Prueba cambio screen";
};

module.exports = appModule;