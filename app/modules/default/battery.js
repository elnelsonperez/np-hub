const ApplicationModule  = require('../../core/module').ApplicationModule

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
    console.log(level)
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

appModule.test = function () {
    return Math.floor((Math.random() * 3) + 1);
}

appModule.controller = function () {
    return this.view(this.test());
}

module.exports = appModule;