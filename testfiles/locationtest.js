const gps = require('../app/tasks/GpsTask');
gps.props = { //These are available to all modules and tasks
    applicationEvent: null,
    config:  {
        distanceBetweenLocations: 5, //meters
        timeoutSendLocation: 5 //Minutes
    },
    input: null,
    serialNumber: null //Pi serial number
}
gps.initialize(true)

setInterval(gps.run.bind(gps), 1000)

gps.getNextLocations(1).then(function (data) {
    console.log(data)
})







