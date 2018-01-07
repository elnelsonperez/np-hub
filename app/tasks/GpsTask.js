const Task  = require('../core/Task').Task
const FixedQueue = require('./../../lib/Queue').FixedQueue
const SerialPort = require('serialport');
const GPS = require('gps');
const dateFormat = require('dateformat');

const GpsTask = new Task (
    {
      name: 'GpsTask',
      data: {
        selectedLocations: new FixedQueue(100),
        rawLocations: new FixedQueue(100),
        lastLocationDate: new Date(),
        locationCallbackRegistered: false
      },
      every: 5000
    }
);

GpsTask.initialize = function () {
  const file = '/dev/ttyUSB0';
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

GpsTask.run = function () {
  if (this.data.rawLocations.length > 0) {
    for (let i=0;i<this.data.rawLocations.length; i++) {
      this.pushOrRejectLocation(this.data.rawLocations.shift())
    }
  }
}

GpsTask.pushOrRejectLocation = function(location) {
  const selectedLocations = this.data.selectedLocations;
  if (selectedLocations.length > 0) {
    const prevloc = selectedLocations[selectedLocations.length - 1]
    const distance = this.distanceBetween(location.lat, location.lng, prevloc.lat, prevloc.lng)
    if (distance > this.props.config.distanceBetweenLocations) {
      this.pushALocation(location)
    } else {
      const now = new Date();
      let timeDiff = now - this.data.lastLocationDate;
      timeDiff /= 1000; //ms to s
      timeDiff /= 60; //s to m
      if (timeDiff > this.props.config.timeoutSendLocation) {
        this.pushALocation(location)
      }
    }
  } else {
    this.pushALocation(location)
  }
}

GpsTask.pushALocation = function (location) {
  this.data.selectedLocations.push(location)
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
          this.removeEventListener('newLocation', callback)
          this.data.locationCallbackRegistered = false;
          returnResult()
        }
      };
      this.on('newLocation', callback)
    }
  })
}

module.exports = GpsTask;