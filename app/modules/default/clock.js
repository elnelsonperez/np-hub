
const appModule = {
    name : 'clock',
    start : 0,
    end : 9,
    line : 1,
    scrolling:false,

    view (time) {

        return "\x03"+ time;
    },

    controller () {
        return this.view(this.getTime());
    },

    getTime () {
        var date = new Date();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0'+minutes : minutes;
        return hours + ':' + minutes + ampm;
    }

};

module.exports = appModule;