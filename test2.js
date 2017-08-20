const gps = require('./app/tasks/gps');
gps.initialize()
gps.run()

gps.getNextLocations(2).then(function (data) {
    console.log(data)
})

gps.getNextLocations(2).then(function (data) {
    console.log(data)
})




