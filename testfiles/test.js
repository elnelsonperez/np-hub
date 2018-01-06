const SequentialSerialManager = require('../lib/SequentialSerialManager').SequentialSerialManager;
const sm = new SequentialSerialManager(false);

const gprs =  require('../lib/GprsManager').GprsManager;
const manager = new gprs(sm);
manager.initialize().then(() => {
    res =  manager.httpPost('http://nppms.us/api/locations/new/'+require('../lib/systeminfo').getSerial(),
        {
            locations: 'Hello'
        }
    ).then((res) => {
        console.log(res)
    })
});

