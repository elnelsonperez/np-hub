const Application = require('./app/App').Application;

app = new Application();
app.disabledFunctionality.lcd = true;
app.initialize();

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

app.props.applicationEvent.on('boot.ready', function () {
    setTimeout(() => {
        app.switchModuleDomain('default')
    }, 1500)
})

process.on('SIGINT', function() {
    console.log('======================\nReceived shut down signal\n========================\n')
    app.injectable.GprsService.turnOff().then(() => {
            process.exit();
    })
});

