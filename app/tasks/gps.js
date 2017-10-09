const Task  = require('./../core/task').Task
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
            onNewLocationListenerInitialized: false
        },
        every: 5000
    }
);


GpsTask.initializeGpsReader = function () {
    const file = '/dev/ttyUSB0';
    const parsers = SerialPort.parsers;
    const parser = new parsers.Readline({
        delimiter: '\r\n'
    });
    const port = new SerialPort(file, {
        baudRate: 9600
    });
    port.pipe(parser);

    parser.on('data', function(data) {
        gps.update(data);

    });

    const gps = new GPS;


    gps.on('GLL', (parsed) => {
        if (parsed.valid === true && parsed.status === "active" && parsed.lat !== null && parsed.lon !== null) {
            const time = dateFormat(parsed.time, "yyyy-mm-dd HH:MM:ss");
            const data = {
                time:time,
                lat: parsed.lat,
                lng: parsed.lon
            }
            this.data.rawLocations.push(data);
        }
    });


}


GpsTask.initialize = function () {
    this.initializeGpsReader();
}

GpsTask.run = function () {
    if (this.data.rawLocations.length > 0) {
        for (let i=0;i<this.data.rawLocations.length; i++) {
            this.pushOrRejectLocation(this.data.rawLocations.shift())
        }
    }
}

GpsTask.pushOrRejectLocation  = function(location) {
    const selectedLocations = this.data.selectedLocations;
    if (selectedLocations.length > 0) {
        const prevloc = selectedLocations[selectedLocations.length - 1]
        const distance = this.distanceBetween(location.lat, location.lng, prevloc.lat, prevloc.lng)
        if (distance > 10) { // 10 meters
           selectedLocations.push(location);
            this.emit('newLocation',selectedLocations.length)
        }
    } else {
        selectedLocations.push(location)
        this.emit('newLocation',selectedLocations.length)
    }
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
  return new Promise((res, rej) => {
    const returnResult = () =>  {
      const result = this.data.selectedLocations.splice(0, amount)
      if (result.length > 0) {
        res(result)
      }
    }
    if (this.data.selectedLocations.length >= amount) {
      returnResult()
    } else {
        if (this.data.onNewLocationListenerInitialized === false) {
          this.on('newLocation', (length) => {
            if (length >= amount) {
              returnResult()
            }
          })
          this.data.onNewLocationListenerInitialized = true;
        }
    }
  })
}

GpsTask.getAverageDistanceBetweenPoints = function (locations) {
    const length = locations.length;
    let results = [];
    if (length > 0) {
        const limit = length & ~1
        for (let i=0;i<limit-1;i++) {
            const distance = this.distanceBetween(locations[i].lat,locations[i].lng,locations[i+1].lat,locations[i+1].lng)
            this.results.push(distance)
        }
    }
    results = arr.filter(function(el) {
        return el.length && el==+el;
    });
    return  results.reduce((a, b) => a + b) / results.length;
}

module.exports = GpsTask;