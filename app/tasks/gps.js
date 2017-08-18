const Task  = require('./../core/task').Task
const FixedQueue = require('./../../lib/Queue').FixedQueue

const GpsTask = new Task (
    {
        name: 'GpsTask',
        data: {
            selectedLocations: [],
            rawLocations: new FixedQueue(100)
        },
        every: 5000
    }
);

GpsTask.initialize = function () {
    //TODO Initialize serial reader and parser

}

GpsTask.run = function () {
    if (this.data.rawLocations.length > 0) {
        for (let i=0;i<this.data.rawLocations.length; i++) {
            this.pushOrRejectLocation(this.rawLocations.shift())
        }
    }
}

GpsTask.pushOrRejectLocation  = function(location) {
    const selectedLocations = this.data.selectedLocations;
    if (selectedLocations > 0) {
        const prevloc = selectedLocations[selectedLocations.length - 1]
        const distance = this.distanceBetween(location.lat, location.lng, prevloc.lat, prevloc.lng)
        if (distance > 7) { // 7 meters
           selectedLocations.push(location);
            this.emit('newLocation',this.selectedLocations.length)
        }
    } else {
        selectedLocations.push(location)
        this.emit('newLocation',this.selectedLocations.length)
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

GpsTask.getNextLocations = async function (amount = 10) { //
    return new Promise((res, rej) => {
        this.on('newLocation', (length) => {
            if (length >= amount) {
                const result = this.data.selectedElements.slice(0, amount)
                this.data.selectedElements = result;
                res(result)
            }
        })
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

modulo.exports = GpsTask;