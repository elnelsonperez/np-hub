const Application = require('./app/app').Application;
app = new Application();
app.initialize();

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


// app.appEvent.on('boot.ready', function () {
//     app.switchModuleDomain('auth')
// })


app.publicProperties.appEvent.on('boot.ready', function () {
    setTimeout(() => {
        app.switchModuleDomain('default')
    },1500)

})

process.on('SIGINT', function() {
    console.log('======================\nReceived shut down signal\n========================\n')
    app.injectable.GprsManager.turnOff().then(() => {
            process.exit();
    })
});

