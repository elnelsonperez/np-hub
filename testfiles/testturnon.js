const SequentialSerialManager = require('../lib/SequentialSerialManager').SequentialSerialManager;
// const sm = new SequentialSerialManager(false);

const gprs =  require('../app/services/GprsService').GprsService;
const Gprs = new gprs();
Gprs.turnOff().then(function () {
     console.log('Turn Off Sequence has been made.');
});
