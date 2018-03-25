const util = require('util')
const EventEmitter = require('events').EventEmitter
const PythonShell = require('python-shell');
const Parser = require ("./messageParser")
const BtMessage = require("./BtMessage")

/**
 * Este servicio se encarga de recibir los mensajes recibidos por el Bluetooth a travez
 * del main.py, que maneja el bluetooth a mas bajo nivel utilizando una libreria de python.
 * El servicio al ser inicializado corre en un nuevo thread el main.py, y se comunica con python a travez
 * del stdin y stdout.
 * @param debug
 * @constructor
 */
const BluetoothService = function ({debug = false}){

  this.idCounter = 1;
  this.parser = new Parser()

  /**
   * Inicializa el bluetooth. Se puede especificar las mac addresses a las cuales el bluetooth
   * les permitira conectarse al hub.
   * @param allowedMacAddresses
   * @param autoPair
   * @param discoverable
   */
  this.initialize = ({
                       allowedMacAddresses = [],
                       autoPair = true,
                       discoverable = true
                     }) => {
    this.shell = new PythonShell("main.py", {
      args: [JSON.stringify({allowedMacAddresses, autoPair, discoverable})],
      scriptPath: __dirname,
      pythonOptions: ['-u'],
    });

    this.shell.on('message', (message) => {
      message = message.trim()
      if (debug === true)
        console.log(message)
      message = this.parser.parse(message)
      if (message) {
        this.emit(message.type, message)
      }
    });

    this.shell.on("error", (e) => {
      if (e.message === "KeyboardInterrupt") {
        console.log("Program Reset")
      } else {
        console.log(e.message)
      }
    })

  }

  this.makeDiscoverable = () => {
    this.invoke('make_discoverable')
  }

  this.disconnectDevice = ({mac_address}) => {
    this.invoke("disconnect_client", {mac_address})
  }

  this.getConnectedDevices = async () => {
    return await this.invokeWithResponse({method: "get_connected_devices"})
  }

  this.invoke = (method, args = null) => {
    let msg = "invoke|"+method
    if (args && isObject(args)) {
      msg += "|" + JSON.stringify(args)
    }
    this.shell.send(msg)
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

  /**
   *
   * @param {String} mac_address
   * @param {BtMessage} message
   */
  this.sendToDevice = ({mac_address, message}) => {
    this.invoke('write_to_client',
        {mac_address, payload: message.payload, type: message.type, corr_id: message.corr_id})
  }

  this.sendWithResponse = ({mac_address, message, timeout = 5000}) => {
    return new Promise((res, rej) => {
      this.sendToDevice({mac_address, message})
      const timeoutId = setTimeout(() => {
        this.removeListener("EVENT", callback)
        rej("Timeout Exceeded")
      }, timeout)

      const callback = (msg) => {
        if (msg.name === "RECEIVED" &&
            msg.body.mac_address &&
            msg.body.mac_address === mac_address &&
            msg.body.data.corr_id &&
            msg.body.data.corr_id === message.corr_id)
        {
          clearInterval(timeoutId)
          this.removeListener("EVENT", callback)
          if (msg.body.data) {
            res(msg.body.data)
          } else {
            res()
          }
        }
      }
      this.on("EVENT", callback)
    })
  }

}

function isObject(obj) {
  return obj === Object(obj);
}

util.inherits(BluetoothService, EventEmitter)
module.exports = BluetoothService;