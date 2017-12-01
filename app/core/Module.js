const util = require('util')
const EventEmitter = require('events').EventEmitter

/**
 * This object defines a screen Module
 */
const appModule = function ({name, start = 0, end = 19, line = 1, scrolling = false, inject = [], data = {}, updateInterval = 1, dependsOn = []}) {
    EventEmitter.call(this) //Modules emit events.
    this.name  = name
    this.ready = true; //If ready = false, module controller method is not called
    this.start  = start //Start position on specified line
    this.end  = end //End position on specified line
    this.line = line //Line in which this module wants to be
    this.scrolling = scrolling //Module causes scrolling text in whole line
    this.inject = inject; //Which other modules does this module want access to?
    this.data = data; //Module internal data
    this.updateInterval = updateInterval;
    this._updateCounter = 0 ;
    this._initialUpdate = false;
    this.dependsOn = dependsOn
}

util.inherits(appModule, EventEmitter)

/**
 * This function basically updates a counter that determines if a module should run based on an updateInterval.
 * If the controller function of all modules in a line is ran every 400ms, and the updateInterval is 2,
 * the module will be ran every 800ms.
 * @returns {boolean}
 */
appModule.prototype.shouldUpdate  = function () {
    if (!this._initialUpdate) {
        this._initialUpdate = true;
        return true;
    }
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