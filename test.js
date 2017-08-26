const SequentialSerialManager = require('./lib/serial').SequentialSerialManager;
const sm = new SequentialSerialManager(true);

const gprs =  require('./lib/gprs').GprsManager;
const manager = new gprs(sm);
manager.initialize().then(() => {

    manager.hasInternet().then(val => {
        if (val) {
            manager.httpGet('http://httpbin.org/uuid').then(val => console.log(val))
        }
    })


});

