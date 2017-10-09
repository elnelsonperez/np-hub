const gps = require('./app/tasks/gps');
gps.initialize()


setInterval(gps.run.bind(gps), 1000)

gps.getNextLocations(1).then(function (data) {
    console.log(data)
})




