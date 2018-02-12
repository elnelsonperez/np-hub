const SequentialSerialManager = require('../lib/SequentialSerialManager').SequentialSerialManager;
const sm = new SequentialSerialManager(false);

const gprs =  require('../app/services/GprsService').GprsService;
const Gprs = new gprs(sm);
Gprs.initialize().then((a) => {
     console.log("GPRS Service initialize method completed")
     console.log(a)
})

