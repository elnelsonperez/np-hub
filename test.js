const SequentialSerialManager = require('./lib/serial').SequentialSerialManager;
const sm = new SequentialSerialManager(false);

const gprs =  require('./lib/gprs').GprsManager;
const manager = new gprs(sm);
manager.initialize().then(() => {
    manager.getSignalStrength().then(val => console.log(val)).catch(e => console.log(e))
});

