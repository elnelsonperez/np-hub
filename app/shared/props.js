module.exports = { //These are available to all modules and tasks
  applicationEvent: null, //Permite disparar y escuchar eventos globales
  config:  { //Configuraciones que bajan desde el servidor.
    distanceBetweenLocations: undefined,
    timeoutSendLocation: undefined,
    allowedMacAddresses: undefined,
    ibuttons: undefined
  },
  input: null, //InputManager instance
  serialNumber: null, //Serial de la pi
  argv: null, //Argumentos pasados al correr la aplicacion. Ej "--noAuth"
  bridge: { //Parametros relacionados al movil conectado por bluetooth.
    connectedMacAddresses: [],
    pullingData : {
      lastPulledMessageDate: null,
      lastPulledIncidenciaDate: null
    }
  },

};