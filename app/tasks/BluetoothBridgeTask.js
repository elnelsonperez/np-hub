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
        pullingData : {
          lastPulledMessageDate: null,
          lastPulledIncidenciaDate: null
        }
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

  props.applicationEvent.on("autopulledMessages", (data) => {this.autoPulledHandler('mensajes',data)})
  props.applicationEvent.on("autopulledIncidencias", (data) => {this.autoPulledHandler('incidencias',data)})

}

BluetoothBridgeTask.autoPulledHandler  = function(type, payload) {
  if (payload && payload.length > 0) {
    let minDate = null;
    for (let m of Object.keys(payload)) {
      const date =  new Date(payload[m].creado_en)
      if (minDate === null) {
        minDate = date;
      } else {
        if (date > minDate) {
          minDate = date;
        }
      }
    }

    if (minDate) {
      if (type === "mensajes") {
        this.data.pullingData.lastPulledMessageDate = dateformat(minDate, "yyyy-mm-dd HH:MM:ss");
      } else if (type === "incidencias") {
        this.data.pullingData.lastPulledIncidenciaDate = dateformat(minDate, "yyyy-mm-dd HH:MM:ss");
      }
    }

    let name = null;
    if (type === "mensajes") {
      name = "NEW_SERVER_MESSAGES";
    } else if (type === "incidencias") {
      name = "NEW_SERVER_INCIDENCIAS";
    }

    for (let mac of this.data.connectedMacAddresses) {
      this.BluetoothService.sendToDevice(
          {
            mac_address: mac,
            message: new BtMessage(
                {
                  type: name,
                  payload: payload
                }
            )
          }
      )
    }

  }
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
  console.log("=======================> Send msg to server received")
  const action = msg.body.data;
  if (action.payload
      && action.payload.oficial_unidad_id
      && action.payload.temp_id
      && action.payload.contenido) {
    this.MensajeService.sendMessage({
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
      }),
      sector: props.config.sector,
      destacamento: props.config.destacamento,
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
    this.data.pullingData.lastPulledMessageDate = null;
    this.data.pullingData.lastPulledIncidenciaDate = null;
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