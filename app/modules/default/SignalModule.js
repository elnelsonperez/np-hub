
const ApplicationModule  = require('../../core/Module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'signal',
        start : 16,
        end : 19,
        line : 1,
        scrolling: false,
        inject: ['GprsManager'],
        updateInterval : 15
    }
);


appModule.controller = function () {

    if (this.shouldUpdate()) {
        this.GprsManager.getSignalStrength().then(val => {
            this.data.signalLevel = val;
        }).catch(e => this.data.signalLevel = 0)
    }

    return this.view();
}


appModule.view = function (level) {
        let res = "\x06";

        if (this.data.signalLevel) {
            level = this.data.signalLevel;

            if (this.data.signalLevel.rssi >= 25) {
                level = 1;
            } else if (this.data.signalLevel.rssi >9 && this.data.signalLevel.rssi < 25) {
                level = 2;
            } else if (this.data.signalLevel.rssi <= 9) {
                level = 3
            } else if (this.data.signalLevel.rssi === 99) {
                level = 0
            }

            if (level === 1) {
                res = '\x06\x00';
            }
            if (level === 2) {
                res = '\x06\x00\x01';
            }
            if (level === 3) {
                res = '\x06\x00\x01\x02';
            }
            if (level === 0) {
                res = "\x06";
            }
        }

    return res;

}

module.exports = appModule;