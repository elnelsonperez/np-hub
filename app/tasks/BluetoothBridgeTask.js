const Task  = require('./../core/Task').Task
const props = require('./../App').props
const BtMessage  = require('./../services/BluetoothService/BtMessage')
const dateformat = require('dateformat')
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
        connectedMacAddresses: [],
        pullingData : {}
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

  props.applicationEvent.on("autopulledMessages", (payload) => {
    if (payload.mensajes && payload.mensajes.length > 0) {
      let minDate = null;
      for (let m of Object.keys(payload.mensajes)) {
        const date =  new Date(payload.mensajes[m].creado_en)
        if (minDate === null) {
          minDate = date;
        } else {
          if (date > minDate) {
            minDate = date;
          }
        }
      }

      if (minDate) {
        this.data.pullingData[payload.mac].lastPulledMessageDate = dateformat(minDate,"yyyy-mm-dd HH:MM:ss");
      }

      this.BluetoothService.sendToDevice(
          {
            mac_address: payload.mac,
            message: new BtMessage(
                {
                  type: "NEW_SERVER_MESSAGES",
                  payload:  payload.mensajes
                }
            )
          }
      )
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
    if (!this.data.pullingData[msg.body.mac_address]) {
      this.data.pullingData[msg.body.mac_address] = {
        lastPulledMessageDate: null
      }
    }
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
      if (this["action_"+action.type]) {
        this["action_"+action.type](msg)
      }
    }
  }
}


BluetoothBridgeTask.action_GET_TODAY_MESSAGES  = function(msg) {
  this.MensajeService.getMensajes({today: true}).then(mensajes => {
    if (mensajes) {
      this.BluetoothService.sendToDevice(
          {
            mac_address: msg.body.mac_address,
            message: new BtMessage(
                {
                  type: "GET_TODAY_MESSAGES_RESPONSE",
                  payload:  mensajes
                }
            )
          }
      )
    }
  })
}

BluetoothBridgeTask.action_SEND_MESSAGE_TO_SERVER = function(msg) {
  const action = msg.body.data;
  if (action.payload
      && action.payload.oficial_unidad_id
      && action.payload.temp_id
      && action.payload.contenido) {
    this.MensajeService.sendMensaje({
      oficial_unidad_id: action.payload.oficial_unidad_id,
      contenido: action.payload.contenido
    }).then(r => {
      if (r !== null) {
        this.BluetoothService.sendToDevice(
            {
              mac_address: msg.body.mac_address,
              message: new BtMessage(
                  {
                    type: "SEND_MESSAGE_TO_SERVER_RESPONSE",
                    payload: {
                      tmp_id: action.payload.temp_id,
                      mensaje: r
                    }
                  }
              )
            }
        )
      }
    })
  }
}
BluetoothBridgeTask.action_GET_DEVICE_CONFIG = function(msg) {
  if (props.config.oficiales) {
    const configs = {
      oficial: props.config.oficiales.find(v => {
        return v.mac_address === msg.mac_address
      })
    }
    this.BluetoothService.sendToDevice(
        {
          mac_address: msg.body.mac_address,
          message: new BtMessage(
              {
                type: "GET_DEVICE_CONFIG_RESPONSE",
                payload: configs
              }
          )
        }
    )
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
    if (this.data.pullingData[msg.body.mac_address]) {
      delete this.data.pullingData[msg.body.mac_address]
    }
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