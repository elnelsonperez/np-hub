const Application = require('./app/app').Application;
app = new Application();
app.initialize();

let val = 0;
// setInterval(function () {
//     if (val === 0) {
//         app.switchModuleDomain('boot')
//         val = 1;
//     }
//     else {
//         app.switchModuleDomain('default')
//         val = 0;
//     }
// }, 4000)



