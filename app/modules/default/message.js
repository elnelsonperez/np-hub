
const ApplicationModule  = require('../../core/Module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'message',
        start : 0,
        end : 19,
        line : 4,
        scrolling: false,
        dependsOn: ['gpsmessage']
    }
);

appModule.view = function () {
    if (this.parentModule.data.count === 0) {
        return "Obteniendo..."
    } else {
        return "Total Enviadas: "+this.parentModule.data.count
    }
};

module.exports = appModule;