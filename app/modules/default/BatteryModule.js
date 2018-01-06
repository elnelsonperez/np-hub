const ApplicationModule  = require('../../core/Module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'battery',
        start : 10,
        end : 14,
        line : 1,
        scrolling: false
    }
);

appModule.view = function (level) {
    let res = "";
    if (level === 1) {
        res = '\x07\x00';
    }
    if (level === 2) {
        res = '\x07\x00\x01';
    }
    if (level === 3) {
        res = '\x07\x00\x01\x02';
    }
    return res;
}


appModule.controller = function () {
    return this.view(3);
}

module.exports = appModule;