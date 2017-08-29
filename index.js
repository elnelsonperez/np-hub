const Application = require('./app/app').Application;
app = new Application();
app.initialize();

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

app.appEvent.on('boot.ready', function () {
    app.switchModuleDomain('auth')

})

app.appEvent.on('auth.ready', function () {
    app.switchModuleDomain('default')
})




