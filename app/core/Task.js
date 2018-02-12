const util = require('util')
const EventEmitter = require('events').EventEmitter

const Task = function ({ name, every = null, data, ready = true,inject =[], autoload = true, siblingTasks = {}}) {
    EventEmitter.call(this)
    this.name = name;
    this.ready = ready; //Is this task ready to be re-ran
    this.every = every; //How often should de Application run this task
    this.data = data;
    this.autoload = autoload;
    this.siblingTasks = siblingTasks;
    this.inject = inject;
}

util.inherits(Task, EventEmitter)

module.exports.Task = Task;
