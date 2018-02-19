const Task  = require('../core/Task').Task
const FixedQueue = require('./../../lib/Queue').FixedQueue
const SerialPort = require('serialport');
const props = require('./../App').props
const GPS = require('gps');
const dateFormat = require('dateformat');

/**
 * Inicializa el serialport para leer la data del modulo GPS y se encarga de validar
 * las localizaciones obtenidas de acuerdo a las configuraciones ya conseguidas
 * desde el servidor
 * @type {Task}
 */
const GpsTask = new Task (
    {
      name: 'GpsTask',
      data: {
        selectedLocations: new FixedQueue(100),
        rawLocations: new FixedQueue(100),
        lastLocationDate: new Date(),
        locationCallbackRegistered: false
      },
      every: 5000,
      ready: false,
      autoload: false
    }
);

GpsTask.initialize = function (debug = false) {

  const init = () => {
    this.ready = true;
    const file = '/dev/serial/by-id/usb-u-blox_AG_-_www.u-blox.com_u-blox_6_-_GPS_Receiver-if00';
    const parsers = SerialPort.parsers;
    const parser = new parsers.Readline({
      delimiter: '\r\n'
    });

    const port = new SerialPort(file, {
      baudRate: 9600
    });

    port.pipe(parser);

    const gps = new GPS;

    parser.on('data', function(data) {
      try {
        gps.update(data);
      } catch (e) {
        console.log(e)
      }
    });

    gps.on('GLL', (parsed) => {
      if (parsed.valid === true &&
          parsed.status === "active" &&
          parsed.lat !== null
          && parsed.lon !== null)
      {
        const time = dateFormat(parsed.time, "yyyy-mm-dd HH:MM:ss");
        this.data.rawLocations.push({
          time: time,
          lat: parsed.lat,
          lng: parsed.lon
        });
      }
    });
  }
  if (debug === false ) {
    props.applicationEvent.on("config.ready", init)
  } else {
    init()
  }

}

GpsTask.run = function () {
  if (this.data.rawLocations.length > 0) {
    for (let i=0;i<this.data.rawLocations.length; i++) {
      this.pushOrRejectLocation(this.data.rawLocations.shift())
    }
  }
}


GpsTask.pushOrRejectLocation = function(location) {
  if (this.data.lastLocation) {
    const prevloc = this.data.lastLocation;
    const distance = this.distanceBetween(location.lat, location.lng, prevloc.lat, prevloc.lng)
    if (props.argv.verbose) {
      console.log("[NEW LOC] D.A.: "+ distance+"\n")
    }
    if (distance > props.config.distanceBetweenLocations) {
      this.pushALocation(location)
    } else {
      const now = new Date();
      let timeDiff = now - this.data.lastLocationDate;
      timeDiff /= 1000; //ms to s
      timeDiff /= 60; //s to m
      if (timeDiff > props.config.timeoutSendLocation) {
        this.pushALocation(location)
      }
    }
  } else {
    this.pushALocation(location)
  }
}

GpsTask.pushALocation = function (location) {
  this.data.selectedLocations.push(location)
  this.data.lastLocation = location;
  this.emit('newLocation', this.data.selectedLocations.length)
  this.data.lastLocationDate = new Date();
}

GpsTask.distanceBetween =  function (lat1, lon1, lat2, lon2) {
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 +
      c(lat1 * p) * c(lat2 * p) *
      (1 - c((lon2 - lon1) * p))/2;
  return 12742000 * Math.asin(Math.sqrt(a));
}

GpsTask.getNextLocations = async function (amount = 1) { //
  return new Promise((res) => {
    const returnResult = () =>  {
      const result = this.data.selectedLocations.splice(0, amount)
      if (result.length > 0) {
        res(result)
      }
    }
    if (this.data.selectedLocations.length >= amount) {
      returnResult()
    }
    if (!this.data.locationCallbackRegistered) {
      this.data.locationCallbackRegistered = true;
      const callback = (length) => {
        if (length >= amount) {
          this.removeListener('newLocation', callback)
          this.data.locationCallbackRegistered = false;
          returnResult()
        }
      };
      this.on('newLocation', callback)
    }

  })
}

module.exports = GpsTask;