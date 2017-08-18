const util = require('util')
const EventEmitter = require('events').EventEmitter

const task = function ({task, name, every, data}) {
    EventEmitter.call(this)

    this.task = task;
    this.name = name;
    this.every = every;
    this.data = data;
}

util.inherits(task, EventEmitter)

module.exports.Task = task;
