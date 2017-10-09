const util = require('util')
const EventEmitter = require('events').EventEmitter

const task = function ({task, name, every = 5000, data, autoload = true,injectable=[]}) {
    EventEmitter.call(this)
    this.task = task;
    this.name = name;
    this.every = every;
    this.data = data;
    this.autoload = autoload;
    this.injectable = injectable;
}

util.inherits(task, EventEmitter)

module.exports.Task = task;
