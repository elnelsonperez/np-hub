const util = require('util')
const EventEmitter = require('events').EventEmitter
const PythonShell = require('python-shell');
const Parser = require ("./messageParser")

const BluetoothService = function ({debug = false, config = null}) {
  /*
  config
  {
    allowedMacAddreses: ["...","..."],
    autoPair: true||false
  }
   */
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

  this.send = ({mac_address, msg}) => {
    if (isObject(msg))
      msg = JSON.stringify(msg)
    const id = this.idCounter++;
    this.invoke('write_to_client',[mac_address, msg, id])
    return id
  }

  this.sendWithResponse = ({mac_address, msg, timeout = 5000}) => {
    return new Promise((res, rej) => {
      const id = this.send({mac_address: mac_address, msg: msg})

      const timeout = this.setTimeout(() => {
        this.removeListener("RETURN", callback)
        rej("Timeout Exceeded")
      }, timeout)

      const callback = (message) => {
        if (message.has("mac_address") &&
            message.has("corr_id") &&
            message.body.mac_address === mac_address &&
            message.body.corr_id === id)
        {
          clearInterval(timeout)
          this.removeListener("RETURN", callback)
          if (message.has("return")) {
            res(message.return)
          } else {
            res()
          }
        }
      }
      this.on("RETURN", callback)
    })
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

util.inherits(BluetoothService, EventEmitter)
module.exports = BluetoothService;