const util = require('util')
const EventEmitter = require('events').EventEmitter

const appModule = function ({name, start = 0, end = 19, line = 1, scrolling = false, inject = [], data = {}, updateInterval = 1, dependsOn = []}) {
    EventEmitter.call(this)
    this.name  = name
    this.start  = start
    this.end  = end
    this.line = line
    this.scrolling = scrolling
    this.inject = inject;
    this.data = data;
    this.updateInterval = updateInterval;
    this._updateCounter = 0;
    this.parentModules = {};
    this.dependsOn = dependsOn
}

util.inherits(appModule, EventEmitter)

appModule.prototype.shouldUpdate  = function () {
    this._updateCounter++;
    if (this._updateCounter === this.updateInterval) {
        this._updateCounter = 0;
        return true;
    }
    return false;
}

appModule.prototype.changeStartEndLine = function ({start = this.start, end = this.end, line = this.line}) {
    this.emit('changeLine',this, {start,end,line})
}
appModule.prototype.view =  function () { return '';}
appModule.prototype.controller = function () {return this.view();}
appModule.prototype.initialize = function () {}

module.exports.ApplicationModule = appModule;