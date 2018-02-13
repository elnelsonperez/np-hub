const Application = require('./app/App').Application;
const props = require('./app/App').props;
const BtMessage = require('./app/services/BluetoothService/BtMessage')
app = new Application();
app.disabledFunctionality.lcd = true;
app.initialize();

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

app.injectable.BluetoothService.on('EVENT', msg => {
    if (msg.name === "RECEIVED") {
      app.injectable.BluetoothService.sendToDevice({mac_address: msg.body.mac_address, message:
      new BtMessage({corr_id : null, type: "TEST", payload:{data: "Eco desde Hub :'"+msg.body.data.payload+"'"}})})
    }
})

props.applicationEvent.on('boot.ready', function () {
    setTimeout(() => {
        // app.switchModuleDomain('default')
      console.log(" ==== BOOT READY ====\n")
    }, 1500)
})

process.on('SIGINT', function() {
    console.log('======================\nReceived shut down signal\n========================\n')
    process.exit();
});

