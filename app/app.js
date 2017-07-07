const line = require('./core/line.js');
const fs = require('fs');
const Lcdlib = require('../lib/lcd');

module.exports =  {
    screen: null,
    lcd: null,
    modules: [],
    timer: null,

    initialize () {
        this.setDefaultApplicationProperties();
        this.lcd.customChar();
        this.printBootingMessage();

        //load modules
        this.loadModules(__dirname+'/modules/default');
        this.applicationLoop()
    },


    switchModuleDomain (folder) {
        if (this.timer)
             windows.clearInterval(this.timer);

        this.setDefaultApplicationProperties();

        //load modules
        this.loadModules('./modules/'+folder);
        this.applicationLoop()
    },

    setDefaultApplicationProperties () {
        this.screen = {
            line1: new line(),
            line2: new line(),
            line3: new line(),
            line4: new line()
        };
        this.lcd = new Lcdlib.LcdController( 1, 0x3f, 20, 4 );
        this.modules = [];
    },

    loadModules (dir, clearModules = false) {
        if (clearModules === true) {
            this.setDefaultApplicationProperties();
        }
        try {
            fs.readdirSync(dir).forEach(file => {
                const module = require(dir+'/'+file);
                this.screen['line' + module.line].setWriter(module);
                this.modules.push(module)
            });
        } catch (e) {
            console.log(e)
            //TODO Print error in LCD
        }
    },

    applicationLoop () {
       this.timer =  setInterval(() => {
            const line1 = this.screen.line1.getProcessedLine();
            const line2 = this.screen.line2.getProcessedLine();
            const line3 = this.screen.line3.getProcessedLine();
            const line4 = this.screen.line4.getProcessedLine();

           if (!this.screen.line1.scrolling)
               this.lcd.println(line1,1);
           else if (!this.screen.line1.scrollingStarted) {
               this.lcd.printlnScroll(line1,1);
               this.screen.line1.scrollingStarted = true;
           }


           if (!this.screen.line2.scrolling)
               this.lcd.println(line2,2);
           else if (!this.screen.line2.scrollingStarted) {
               this.lcd.printlnScroll(line2,2);
               this.screen.line2.scrollingStarted = true;
           }


           if (!this.screen.line3.scrolling)
               this.lcd.println(line3,3);
           else if (!this.screen.line3.scrollingStarted) {
               this.screen.line3.scrollingStarted = true;
               this.lcd.printlnScroll(line3,3);
           }


           if (!this.screen.line4.scrolling)
               this.lcd.println(line4,4);
           else if (!this.screen.line4.scrollingStarted) {
               this.screen.line4.scrollingStarted = true;
               this.lcd.printlnScroll(line4,4);
           }

        },450)
    },

    printBootingMessage () {
        this.lcd.clear();
        this.lcd.println('\x04 NP  PMS \x05', 2, true);
        this.lcd.println('\x04 BOOTING \x05', 3, true);
    }

};