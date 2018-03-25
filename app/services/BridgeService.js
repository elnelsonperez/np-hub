const props = require('./../shared/props')
const BtMessage  = require('./../services/BluetoothService/BtMessage')
const dateformat = require('dateformat')

/**
 * Este servicio se encarga de coordinar las operaciones que se realizan entre la aplicacion movil
 * y el Hub.
 * @param {BluetoothService} BluetoothService
 * @param {MensajeService} MensajeService
 * @param {StatsService} StatsService
 * @param {IncidenciaService} IncidenciaService
 * @param {IbuttonService} IbuttonService
 * @constructor
 */
const BridgeService = function (
    {
      BluetoothService,
      MensajeService,
      IncidenciaService,
      IbuttonService,
      StatsService
    }
) {
  this.BluetoothService = BluetoothService;
  this.MensajeService = MensajeService;
  this.IncidenciaService = IncidenciaService;
  this.IbuttonService = IbuttonService;
  this.StatsService = StatsService;

  this.start = () => {

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
            console.log("CONNECTIONS ==============> ", props.bridge.connectedMacAddresses)
          }
          break
        case "NEW_CONNECTION":
          this.newConnection(msg)
          if (props.argv.bridgeDebug) {
            console.log("CONNECTIONS ==============> ", props.bridge.connectedMacAddresses)
          }
          break
        case "UNAUTHORIZED":
          break
      }
    })

    props.applicationEvent.on("autopulledMessages",
        (data) => {this.autoPulledHandler('mensajes', data)})

    props.applicationEvent.on("autopulledIncidencias",
        (data) => {this.autoPulledHandler('incidencias', data)})

  }

  /**
   *
   * @param {pythonMessage} msg
   */
  this.newConnection =  (msg) => {
    if (msg.has("mac_address")) {
      if (!props.argv.noAuth) {

        this.IbuttonService.startBlinking()

        const login = () => {
          this.IbuttonService.readOnlyValid().then(code => {
            if (props.config.ibuttons
                && props.config.ibuttons[msg.body.mac_address]
            ) {
              if (code === props.config.ibuttons[msg.body.mac_address]) {
                //logged in
                if (!props.bridge.connectedMacAddresses.includes(msg.body.mac_address)) {
                  props.bridge.connectedMacAddresses.push(msg.body.mac_address)
                  this.BluetoothService.sendToDevice(
                      {
                        mac_address: msg.body.mac_address,
                        message: new BtMessage(
                            {
                              type: "AUTH_STATUS",
                              payload:  {
                                status: 'SUCCESS'
                              }
                            }
                        )
                      }
                  )
                  this.IbuttonService.stopBlinking()
                }
              }
              else { //Invalid ibutton para la mac address conectada
                this.BluetoothService.sendToDevice(
                    {
                      mac_address: msg.body.mac_address,
                      message: new BtMessage(
                          {
                            type: "AUTH_STATUS",
                            payload:  {
                              status: 'FAILED'
                            }
                          }
                      )
                    }
                )
                login()
              }
            } else { //No hay ibutton para la mac address conectada
              this.BluetoothService.sendToDevice(
                  {
                    mac_address: msg.body.mac_address,
                    message: new BtMessage(
                        {
                          type: "AUTH_STATUS",
                          payload:  {
                            status: 'NOT_EXIST'
                          }
                        }
                    )
                  }
              )
              login()
            }
          })
        }

        login()
      }
      else { //Auth directo bypass
        if (!props.bridge.connectedMacAddresses.includes(msg.body.mac_address)) {
          props.bridge.connectedMacAddresses.push(msg.body.mac_address)
        }
        this.BluetoothService.sendToDevice(
            {
              mac_address: msg.body.mac_address,
              message: new BtMessage(
                  {
                    type: "AUTH_STATUS",
                    payload:  {
                      status: 'SUCCESS'
                    }
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
  this.received = function (msg) {
    if (msg.has("mac_address")) {
      //Si la mac address esta en este array es porque ya esta logueado
      if (props.bridge.connectedMacAddresses.includes(msg.body.mac_address)) {
        if (msg.has("data")) {
          const action = msg.body.data;
          if (action.type && action.payload) {
            if (this["action_"+action.type]) {
              this["action_"+action.type](msg)
            }
          }
        }
      }
    }
  }

  this.autoPulledHandler  = (type, payload) => {
    if (payload && payload.length > 0) {
      let maxDate = null;
      for (let m of Object.keys(payload)) {
        const date =  new Date(payload[m].actualizado_en)
        if (maxDate === null) {
          maxDate = date;
        } else {
          if (date > maxDate) {
            maxDate = date;
          }
        }
      }

      if (maxDate) {
        if (type === "mensajes") {
          if (
              props.bridge.pullingData.lastPulledMessageDate == null ||
              new Date(props.bridge.pullingData.lastPulledMessageDate) < maxDate
          ) {
            props.bridge.pullingData.lastPulledMessageDate = dateformat(maxDate, "yyyy-mm-dd HH:MM:ss");
          }
        } else if (type === "incidencias") {
          props.bridge.pullingData.lastPulledIncidenciaDate = dateformat(maxDate, "yyyy-mm-dd HH:MM:ss");
        }
      }

      let name = null;
      if (type === "mensajes") {
        name = "NEW_SERVER_MESSAGES";
      } else if (type === "incidencias") {
        name = "NEW_SERVER_INCIDENCIAS";
      }

      for (let mac of props.bridge.connectedMacAddresses) {
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

  this.action_GET_TODAY_MESSAGES  = (msg) => {
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

  this.action_GET_SECTOR_STATS = (msg) => {
    const action = msg.body.data;
    if (action.payload
        && action.payload.sector_id) {
      this.StatsService.getStats({sector_id: action.payload.sector_id}).then(r => {
        if (r !== null) {
          this.BluetoothService.sendToDevice(
              {
                mac_address: msg.body.mac_address,
                message: new BtMessage(
                    {
                      type: "GET_SECTOR_STATS_RESPONSE",
                      payload: {
                        stats: r,
                        status: "OK",
                        callPayload: null
                      }
                    }
                )
              }
          )
        }
        else {
          this.BluetoothService.sendToDevice(
              {
                mac_address: msg.body.mac_address,
                message: new BtMessage(
                    {
                      type: "GET_SECTOR_STATS_RESPONSE",
                      payload: {
                        stats: r,
                        status: "FAILED",
                        callPayload: action.payload
                      }
                    }
                )
              }
          )
        }

      })
    }

  }

  this.action_SEND_MESSAGE_TO_SERVER = (msg) => {
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
                        mensaje: r,
                        status: "OK",
                        callPayload: null
                      }
                    }
                )
              }
          )
        } else {
          this.BluetoothService.sendToDevice(
              {
                mac_address: msg.body.mac_address,
                message: new BtMessage(
                    {
                      type: "SEND_MESSAGE_TO_SERVER_RESPONSE",
                      payload: {
                        tmp_id: null,
                        mensaje: null,
                        status: "FAILED",
                        callPayload: action.payload
                      }
                    }
                )
              }
          )
        }
      })
    }
  }

  this.action_UPDATE_MESSAGES_STATUS = (msg)=> {
    const action = msg.body.data;
    if (action.payload
        && action.payload.mensajes_ids
        && action.payload.estado_id) {
      this.MensajeService.updateMessagesStatus({
        mensajes_ids: action.payload.mensajes_ids,
        estado_id: action.payload.estado_id
      }).then(r => {
        if (r !== null) {
          this.BluetoothService.sendToDevice(
              {
                mac_address: msg.body.mac_address,
                message: new BtMessage(
                    {
                      type: "UPDATE_MESSAGES_STATUS_RESPONSE",
                      payload: {
                        status: 'OK',
                        callPayload: action.payload
                      }
                    }
                )
              }
          )
        } else {
          this.BluetoothService.sendToDevice(
              {
                mac_address: msg.body.mac_address,
                message: new BtMessage(
                    {
                      type: "UPDATE_MESSAGES_STATUS_RESPONSE",
                      payload: {
                        status: 'FAILED',
                        callPayload: action.payload
                      }
                    }
                )
              }
          )
        }
      })
    }
  }

  this.action_UPDATE_INCIDENCIA_STATUS = (msg)=> {
    const action = msg.body.data;
    if (action.payload
        && action.payload.incidencia_id
        && action.payload.estado_id) {
      this.IncidenciaService.updateIncidenciaStatus({
        incidencia_id: action.payload.incidencia_id,
        estado_id: action.payload.estado_id
      }).then(r => {
        if (r !== null) {
          this.BluetoothService.sendToDevice(
              {
                mac_address: msg.body.mac_address,
                message: new BtMessage(
                    {
                      type: "UPDATE_INCIDENCIA_STATUS_RESPONSE",
                      payload: {
                        status: 'OK',
                        incidencia: r,
                        callPayload: action.payload
                      }
                    }
                )
              }
          )
        } else {
          this.BluetoothService.sendToDevice(
              {
                mac_address: msg.body.mac_address,
                message: new BtMessage(
                    {
                      type: "UPDATE_INCIDENCIA_STATUS_RESPONSE",
                      payload: {
                        status: 'FAILED',
                        callPayload: action.payload
                      }
                    }
                )
              }
          )
        }
      })
    }
  }

  this.action_GET_DEVICE_CONFIG = (msg)=> {

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
  this.initialized = function (msg) {

  }

  /**
   *
   * @param {pythonMessage} msg
   */
  this.disconnected = function (msg) {
    if (msg.has("mac_address")
        && props.bridge.connectedMacAddresses.includes(msg.body.mac_address)) {
      props.bridge.connectedMacAddresses.splice(
          props.bridge.connectedMacAddresses.findIndex(v => v === msg.body.mac_address), 1)
      props.bridge.pullingData.lastPulledMessageDate = null
      props.bridge.pullingData.lastPulledIncidenciaDate = null
    }
  }

  /**
   *
   * @param {pythonMessage} msg
   */
  this.awaitingConnection = function (msg) {

  }

}

module.exports = BridgeService;