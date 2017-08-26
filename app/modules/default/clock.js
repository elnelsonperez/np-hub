const ApplicationModule  = require('../../core/module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'clock',
        start : 0,
        end : 9,
        line : 1,
        scrolling: false
    }
);

appModule.view = function (time) {
    return "\x03"+ time;
};

appModule.controller = function () {
   return this.view(this.getTime());
 };

appModule.getTime = function () {
    let date = new Date();
    let hours = date.getHours();
    let  minutes = date.getMinutes();
    let  ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    return hours + ':' + minutes + ampm;
}

module.exports = appModule;