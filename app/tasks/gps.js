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

    //Mock
    this.data.rawLocations = [{
        lat: 19.452874,
        lng:  -70.695408,
        date: '2017-25-05 06:25:50'
    },
        {
            lat: 19.452745,
            lng:  -70.695408,
            date: '2017-25-05 06:25:50'
        },
        {
            lat: 19.432874,
            lng:  -70.695408,
            date: '2017-25-05 06:25:50'
        },
        {
            lat: 19.452874,
            lng:  -70.695408,
            date: '2017-25-05 06:25:50'
        },
        {
            lat: 19.452874,
            lng:  -70.695408,
            date: '2017-25-05 06:25:50'
        },
        {
            lat: 19.452874,
            lng:  -70.695408,
            date: '2017-25-05 06:25:50'
        },
        {
            lat: 19.452874,
            lng:  -70.695408,
            date: '2017-25-05 06:25:50'
        },
        {
            lat: 19.452874,
            lng:  -70.695408,
            date: '2017-25-05 06:25:50'
        },
    ];
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
        if (distance > 7) { // 7 meters
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

GpsTask.getNextLocations = async function (amount = 10) { //
    return new Promise((res, rej) => {
        const returnResult = () =>  {
            const result = this.data.selectedLocations.splice(0, amount )
            res(result)
        }

        if (this.data.selectedLocations.length >= amount) {
            returnResult()
        } else {
            this.on('newLocation', (length) => {
                if (length >= amount) {
                    returnResult()
                }
            })
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