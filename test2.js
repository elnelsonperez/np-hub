const gps = require('./app/tasks/gps');
gps.initialize()
gps.getNextLocations(5).then(function (data) {
    console.log(data)
})
gps.run()