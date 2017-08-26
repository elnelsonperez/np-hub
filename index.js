const Application = require('./app/app').Application;
app = new Application();
app.initialize();

app.appEvent.on('boot.ready', function () {
    app.switchModuleDomain('auth')
})

app.appEvent.on('auth.ready', function () {
    app.switchModuleDomain('default')
})




