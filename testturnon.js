const SequentialSerialManager = require('./lib/serial').SequentialSerialManager;
// const sm = new SequentialSerialManager(false);

const gprs =  require('./lib/gprs').GprsManager;
const Gprs = new gprs();
Gprs.turnOff().then(function () {
     console.log('Turn Off Sequence has been made.');
});
