
const ApplicationModule  = require('../../core/module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'message',
        start : 0,
        end : 20,
        line : 3,
        scrolling: false
    }
);

appModule.view = function () {
    return "Prueba cambio screen";
};

module.exports = appModule;