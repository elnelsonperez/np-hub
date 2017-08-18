

const Application = require('./app/app').Application;
app = new Application();
app.initialize();

let val = 0;
setInterval(function () {
    if (val === 0) {
        app.switchModuleDomain('boot')
        val = 1;
    }
    else {
        app.switchModuleDomain('default')
        val = 0;
    }

}, 4000)

// lcd.clear();
// lcd.customChar();
//
// const val = '\x01';
// lcd.println(val);
// lcd.printBig('A');
// lcd.println('\x09 NP PMS \x10', 1, true);
// lcd.printlnScroll("They see me rolling ....  THEY HATIIINN",2,2);




