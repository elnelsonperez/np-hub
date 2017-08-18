const Task  = require('./../core/task').Task

const GpsTask = new Task (
    {
        name : 'GpsTask',
        every: 4000,
        data: {
            selectedLocations: [],
            rawLocations: []
        }
    }

);

GpsTask.pushOrRejectLocation  = function(location) {
    const selectedLocations = this.data.selectedLocations;
    if (selectedLocations > 0) {
        const prevloc = selectedLocations[selectedLocations.length - 1]
        const distance = this.distanceBetween(location.lat, location.lng, prevloc.lat, prevloc.lng)
        if (distance > 6) { // 6 meters
           selectedLocations.push(location);
        }
    } else {
        selectedLocations.push(location)
    }
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

GpsTask.distanceBetween =  function (lat1, lon1, lat2, lon2) {
    const p = 0.017453292519943295;
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p)/2 +
        c(lat1 * p) * c(lat2 * p) *
        (1 - c((lon2 - lon1) * p))/2;
    return 12742000 * Math.asin(Math.sqrt(a));
}

GpsTask.getLastLocationsFromQueue = function (amount = 10) {
    const result = [];
    const queue = this.data.locationsQueue;
    if (!this.data.locationsQueue.isEmpty()) {
        const long = queue.getLength();
        if (long >= amount) {
            for(let i=0;i<amount;i++ ) {
                result.push(queue.dequeue())
            }
        }
    }
    return result;
}

modulo.exports = GpsTask;