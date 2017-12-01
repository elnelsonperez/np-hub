
const ApplicationModule  = require('../../core/module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'message',
        start : 0,
        end : 19,
        line : 4,
        scrolling: false,
        dependsOn: 'gpsmessage'
    }
);

appModule.view = function () {
    if (this.parentModule.count === 0) {
        return "Obteniendo..."
    } else {
        return "Locs Enviadas: "+this.parentModule.count
    }
};

module.exports = appModule;