const Application = require('./app/App').Application;

app = new Application();

app.initialize();

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

app.props.applicationEvent.on('boot.ready', function () {
    setTimeout(() => {
        app.switchModuleDomain('default')
    },1500)
})

// app.props.input.on('INPUT:showAuth:PRESSED', function () {
//     if (app.currentModuleDomain === 'auth') {
//         app.switchModuleDomain('default')
//     } else {
//         app.switchModuleDomain('auth')
//     }
// })

process.on('SIGINT', function() {
    console.log('======================\nReceived shut down signal\n========================\n')
    app.injectable.GprsManager.turnOff().then(() => {
            process.exit();
    })
});

