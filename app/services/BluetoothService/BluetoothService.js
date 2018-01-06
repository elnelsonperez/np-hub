const util = require('util')
const EventEmitter = require('events').EventEmitter
const PythonShell = require('python-shell');
const Parser = require ("./messageParser")

const BluetoothService = function ({debug = false, config = null}) {
  this.initialize = () => {
    if (config) {
      this.shell = new PythonShell('main.py', {
        args: [JSON.stringify(config)]
      });
    } else {
      this.shell = new PythonShell('main.py')
    }
  }

  this.idCounter = 1;
  this.parser = new Parser()

  this.shell.on('message',  (message) => {
    if (debug === true)
      console.log(message)
    message = this.parser.parse(message)
    if (message) {
      this.emit(message.type, message)
    }
  });

  this.send = (mac_address, msg) => {
    if (isObject(msg))
      msg = JSON.stringify(msg)
    this.invoke('write_to_client',[mac_address,msg,this.idCounter++])
  }

  this.invoke = (method, args = null) => {
    let msg = "invoke||"+method
    if (args) {
      msg += "|"+args.join("|")
    }
    this.shell.send(msg)
  }
}

function isObject(obj) {
  return obj === Object(obj);
}

function capitalizeFirstLetter(string) {
  return string.toLowerCase().charAt(0).toUpperCase() + string.slice(1);
}

util.inherits(BluetoothService, EventEmitter)
module.exports = BluetoothService;