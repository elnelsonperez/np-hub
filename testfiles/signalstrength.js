const SequentialSerialManager = require('../lib/SequentialSerialManager').SequentialSerialManager;
const sm = new SequentialSerialManager(false);

const gprs =  require('../app/services/GprsService').GprsService;
const Gprs = new gprs(sm);

let ready = true;
setInterval(() => {
  if (ready === true) {
    ready = false;
    Gprs.getSignalStrength().then(() => {
      ready = true;
    }).catch(e => {
      console.log(e.message)
    })
  }

}, 1000)