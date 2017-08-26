const SequentialSerialManager = require('./lib/serial').SequentialSerialManager;
const sm = new SequentialSerialManager(true);

const gprs =  require('./lib/gprs').GprsManager;
const manager = new gprs(sm);
manager.initialize().then(() => {
    manager.httpGet('http://httpbin.org/ip').then (res => console.log(res))
});

