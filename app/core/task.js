const util = require('util')
const EventEmitter = require('events').EventEmitter

const task = function ({ name, every = 5000, data, ready = true,inject =[], autoload = true}) {
    EventEmitter.call(this)
    this.name = name;
    this.ready = ready; //Is this task ready to be re-ran
    this.every = every; //How often should de Application run this task
    this.data = data;
    this.autoload = autoload; //Should the Application auto-load it on boot?
    this.inject = inject;
}

util.inherits(task, EventEmitter)

module.exports.Task = task;
