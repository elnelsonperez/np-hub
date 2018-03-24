module.exports = { //These are available to all modules and tasks
  applicationEvent: null,
  config:  {
    distanceBetweenLocations: undefined,
    timeoutSendLocation: undefined,
    allowedMacAddresses: undefined,
    ibuttons: undefined
  },
  input: null,
  serialNumber: null, //Pi serial number,
  argv: null,
  bridge: {
    connectedMacAddresses: [],
    pullingData : {
      lastPulledMessageDate: null,
      lastPulledIncidenciaDate: null
    }
  },

};