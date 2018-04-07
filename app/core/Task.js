const util = require('util')
const EventEmitter = require('events').EventEmitter
const reset = require('./../../lib/functions').reset;

/**
 * Define la estructura base de un task.
 */
const Task = function ({errorTreshold = 10, name, every = null, data, ready = true,inject =[], autoload = true, siblingTasks = {}}) {
    EventEmitter.call(this)
    this.name = name; //Nombre del task.
    this.ready = ready; //Esta la aplicacion 'ready' para ser corrida?
    this.every = every; //How often should de Application run this task
    this.data = data; //Data interna del task
    this.autoload = autoload;

   /*
    Hace referencia a todos los otros tasks de la aplicacion,
    de manera que se puede obtener, por ejemplo data de otro task.
    */
    this.siblingTasks = siblingTasks;

    /*
      Especifica cuales servicios deben ser inyectados al task, de manera que esten disponibles
      en la instancia.
      Por ejemplo, si inject = ['GprsService'], la clase puede acceder al GprsService haciendo this.GprsService
     */
    this.inject = inject;

    /*
      Cada task tiene un contador interno de errores que cuando llega a un treshold, forza
      la pi a resetearse.
      Una forma de hacer que si algo esta fallando sin control, que se reinicie el sistema.
     */
    this.errorCounter = 0;
    this.errorTreshold = errorTreshold;
    this.errorsAdd = function () {
      this.errorCounter++;
      if (this.errorCounter >= this.errorTreshold) {
        console.log("=============> "+ this.name + " WOULD RESET PI HERE");
        process.exit()
        reset()
      }
    }
    this.errorsClear = function () {
      this.errorCounter = 0;
    }

}

util.inherits(Task, EventEmitter)

module.exports.Task = Task;
