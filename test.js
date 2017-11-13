const SequentialSerialManager = require('./lib/serial').SequentialSerialManager;
const sm = new SequentialSerialManager(false);

const gprs =  require('./lib/gprs').GprsManager;
const manager = new gprs(sm);
manager.initialize().then(() => {
    res =  manager.httpPost('http://nppms.us/api/locations/new/'+require('./lib/systeminfo').getSerial(),
        {
            locations: 'Hello'
        }
    ).then((res) => {
        console.log(res)
    })
});

