const SequentialSerialManager = require('../lib/SequentialSerialManager').SequentialSerialManager;
const sm = new SequentialSerialManager(false);

const gprs =  require('../app/services/GprsService').GprsService;
const Gprs = new gprs(sm);

setInterval(() => {
Gprs.getSignalStrength()
}, 1000)