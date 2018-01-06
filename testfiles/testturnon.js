const SequentialSerialManager = require('../lib/SequentialSerialManager').SequentialSerialManager;
// const sm = new SequentialSerialManager(false);

const gprs =  require('../lib/GprsManager').GprsManager;
const Gprs = new gprs();
Gprs.turnOff().then(function () {
     console.log('Turn Off Sequence has been made.');
});
