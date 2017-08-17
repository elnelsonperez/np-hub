const util = require('util')
const events = require('events')
util.inherits(GprsManager,events.EventEmitter)

const appModule = function ({name, start = 0, end = 19, line = 1, scrolling = false, inject = [], data = {}}) {
    events.EventEmitter.call(this)

    this.name  = name
    this.start  = start
    this.end  = end
    this.line = line
    this.scrolling = scrolling
    this.inject = inject;
    this.data = data;
}

appModule.prototype.changeStartEndLine = function ({start = this.start, end = this.end, line = this.line}) {
    this.emit('changeLine',this, {start,end,line})
}
appModule.prototype.view =  function () { return '';}
appModule.prototype.controller = function () {return this.view();}
appModule.prototype.initialize = function () {}

module.exports.ApplicationModule = appModule;