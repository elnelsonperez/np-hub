const util = require('util')
const EventEmitter = require('events').EventEmitter
const reset = require('./../../lib/functions').reset;
const Task = function ({errorTreshold = 10, name, every = null, data, ready = true,inject =[], autoload = true, siblingTasks = {}}) {
    EventEmitter.call(this)
    this.name = name;
    this.ready = ready;
    this.every = every; //How often should de Application run this task
    this.data = data;
    this.autoload = autoload;
    this.siblingTasks = siblingTasks;
    this.inject = inject;
    this.errorCounter = 0;
    this.errorTreshold = errorTreshold;
    this.errorsAdd = function () {
      this.errorCounter++;
      if (this.errorCounter >= this.errorTreshold) {
        console.log("=============> "+ this.name + " WOULD RESET PI HERE");
        process.exit()
        // reset()
      }
    }
    this.errorsClear = function () {
      this.errorCounter = 0;
    }
}

util.inherits(Task, EventEmitter)

module.exports.Task = Task;
