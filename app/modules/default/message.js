
const ApplicationModule  = require('../../core/module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'message',
        start : 0,
        end : 20,
        line : 3,
        scrolling: true
    }
);

appModule.prototype.view = function () {
    return "Mensaje de prueba";
};

module.exports = appModule;