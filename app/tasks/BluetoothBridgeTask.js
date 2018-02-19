const Task  = require('./../core/Task').Task
const props = require('./../App').props
const BtMessage  = require('./../services/BluetoothService/BtMessage')
/**
 * Se encarga de interpretar los mensajes reportados por el servicio de Bluetooth.
 * Sirve como puente entre la data en el Hub y los dispositivos conectados por Bt.
 * @type {Task}
 */
const BluetoothBridgeTask = new Task (
    {
      name: 'BluetoothBridgeTask',
      inject: ['BluetoothService','MensajeService'],
      //Only needs to be initialized
      every: null,
      autoload: false,
      ready: false,
      data: {
        connectedMacAddresses: []
      }
    }
);

BluetoothBridgeTask.initialize = function () {
  this.BluetoothService.on("EVENT", msg => {

    switch (msg.name) {
      case "AWAITING_NEW_CONNECTION":
        this.awaitingConnection(msg)
        break
      case "INITIALIZED":
        this.initialized(msg)
        break
      case "RECEIVED":
        this.received(msg)
        break
      case "DISCONNECTED":
        this.disconnected(msg)
        if (props.argv.bridgeDebug) {
          console.log("CONNECTIONS ==============> ", this.data.connectedMacAddresses)
        }
        break
      case "NEW_CONNECTION":
        this.newConnection(msg)
        if (props.argv.bridgeDebug) {
          console.log("CONNECTIONS ==============> ", this.data.connectedMacAddresses)
        }
        break
      case "UNAUTHORIZED":
        break
    }

  })
}

/**
 *
 * @param {pythonMessage} msg
 */
BluetoothBridgeTask.newConnection = function (msg) {
  if (msg.has("mac_address")
      && !this.data.connectedMacAddresses.includes(msg.body.mac_address)) {
    this.data.connectedMacAddresses.push(msg.body.mac_address)
  }
}

/**
 *
 * @param {pythonMessage} msg
 */
BluetoothBridgeTask.received = function (msg) {
  if (msg.has("mac_address") && msg.has("data")) {
    const action = msg.body.data;
    if (action.type && action.payload) {
      switch (action.type) {
        case "GET_TODAY_MENSAJES" :
          this.MensajeService.getMensajes({today: true}).then(mensajes => {
            if (mensajes) {
              this.BluetoothService.sendToDevice(
                  {
                    mac_address: msg.body.mac_address,
                    message: new BtMessage(
                        {
                          type: "GET_TODAY_MENSAJES_RESPONSE",
                          payload:  {mensajes}
                        }
                    )
                  }
              )
            }
          })
          break
      }
    }

  }
}

/**
 *
 * @param {pythonMessage} msg
 */
BluetoothBridgeTask.initialized = function (msg) {

}

/**
 *
 * @param {pythonMessage} msg
 */
BluetoothBridgeTask.disconnected = function (msg) {
  if (msg.has("mac_address")
      && this.data.connectedMacAddresses.includes(msg.body.mac_address)) {
    this.data.connectedMacAddresses.splice(
        this.data.connectedMacAddresses.findIndex(v => v === msg.body.mac_address),1)
  }
}


/**
 *
 * @param {pythonMessage} msg
 */
BluetoothBridgeTask.awaitingConnection = function (msg) {

}

BluetoothBridgeTask.run = function () {
  this.ready = false;
}

module.exports = BluetoothBridgeTask;