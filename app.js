const Application = require('./app/App').Application;
const props = require('./app/App').props;
app = new Application();
app.disabledFunctionality.lcd = true;
app.initialize();

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

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

