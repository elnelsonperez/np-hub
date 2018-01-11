const util = require('util')
const EventEmitter = require('events').EventEmitter
const PythonShell = require('python-shell');
const Parser = require ("./messageParser")

const BluetoothService = function (
    {
      debug = false,
      config = {
        // allowedMacAddreses: [],
        autoPair: true,
        discoverable: true
      }
    }
) {

  this.idCounter = 1;
  this.parser = new Parser()

  this.initialize = () => {
    this.shell = new PythonShell("main.py", {
      args: [JSON.stringify(config)],
      scriptPath: __dirname,
      pythonOptions: ['-u'],
    });

    this.shell.on('message', (message) => {
      if (debug === true)
        console.log(message)
      message = this.parser.parse(message)
      if (message) {
        this.emit(message.type, message)
      }
    });

  }

  this.reset = () => {
    this.shell.childProcess.kill('SIGINT');
    this.idCounter = 1;
    this.initialize()
  }

  this.makeDiscoverable = () => {
    this.invoke('make_discoverable')
  }

  this.sendToDevice = ({mac_address, payload}) => {
    this.invoke('write_to_client',{mac_address, payload})
  }

  this.getConnectedDevices = async () => {
    return await this.invokeWithResponse({method: "get_connected_devices"})
  }

  this.invokeWithResponse = ({method, params = null, timeout = 6000}) => {
    return new Promise((res, rej) => {
      const corr_id = this.idCounter++;
      this.invoke(method,{...params, corr_id})
      const timeoutId = setTimeout(() => {
        this.removeListener("RETURN", callback)
        rej("Timeout Exceeded")
      }, timeout)
      const callback = (message) => {
        if (
            message.name === method &&
            message.has("corr_id") &&
            message.body.corr_id !== null &&
            message.body.corr_id === corr_id)
        {
          clearInterval(timeoutId)
          this.removeListener("RETURN", callback)
          if (message.has("return")) {
            res(message.body.return)
          } else {
            res()
          }
        }
      }
      this.on("RETURN", callback)
    })
  }

  this.sendWithResponse = ({mac_address, payload, timeout = 5000}) => {
    return new Promise((res, rej) => {
      const corr_id = this.idCounter++
      this.invoke('write_to_client',{mac_address, payload, corr_id, reach_device: true})

      const timeout = this.setTimeout(() => {
        this.removeListener("EVENT", callback)
        rej("Timeout Exceeded")
      }, timeout)

      const callback = (message) => {
        if (message.name === "RECEIVED" &&
            message.has("mac_address") &&
            message.has("corr_id") &&
            message.body.corr_id !== null &&
            message.body.mac_address !== null &&
            message.body.mac_address === mac_address &&
            message.body.corr_id === corr_id)
        {
          clearInterval(timeout)
          this.removeListener("EVENT", callback)
          if ( message.body.payload) {
            res(message.body.payload)
          } else {
            res()
          }
        }
      }
      this.on("EVENT", callback)
    })
  }

  this.invoke = (method, args = null) => {
    let msg = "invoke|"+method
    if (args && isObject(args)) {
      msg += "|" + JSON.stringify(args)
    }
    this.shell.send(msg)
  }
}

function isObject(obj) {
  return obj === Object(obj);
}

util.inherits(BluetoothService, EventEmitter)
module.exports = BluetoothService;