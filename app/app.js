const line = require('./core/line.js');
const fs = require('fs');
const Lcdlib = require('../lib/lcd');
const serialManager = require('./../lib/serial').SerialManager;
const GprsManager =  require('./../lib/gprs').GprsManager;

module.exports.Application = app;
app = function () {
    this.screen= null
    this.  lcd= null
    this. modules= []
    this. timer= null
    this. injectable= {}

    this.initialize = () => {
        this.setDefaultApplicationProperties();
        const SerialManager = new serialManager(true);
        this.injectable.SerialManager = SerialManager;
        this.injectable.GprsManager = new GprsManager(SerialManager);
        this.lcd.customChar();
        this.printBootingMessage();

        //load modules
        this.loadModules(__dirname+'/modules/boot');
        this.applicationLoop()
    }

    this.switchModuleDomain =  (folder) => {
        if (this.timer)
            windows.clearInterval(this.timer);

        this.setDefaultApplicationProperties();

        //load modules
        this.loadModules('./modules/'+folder);
        this.applicationLoop()
    }

    this.setDefaultApplicationProperties = () => {
        this.screen = {
            line1: new line(),
            line2: new line(),
            line3: new line(),
            line4: new line()
        };
        this.lcd = new Lcdlib.LcdController( 1, 0x3f, 20, 4 );
        this.modules = [];
    }

    this.loadModules = (dir, clearModules = false) => {
        if (clearModules === true) {
            this.setDefaultApplicationProperties();
        }
        try {
            fs.readdirSync(dir).forEach(file => {
                const module = require(dir+'/'+file);

                if (module) {
                    for (let moduleName of module.inject) {
                        if (this.injectable[moduleName]) {
                            module[moduleName] = this.injectable[moduleName];
                        }
                    }

                    if (module.initialize) {
                        module.initialize()
                    }
                    module.on('changeLine', this.changeModuleLine)
                }

                this.screen['line' + module.line].setWriter(module);
                this.modules.push(module)
            });
        } catch (e) {
            console.log(e)
            //TODO Print error in LCD
        }
    }

    this.changeModuleLine = (module, args) => {
        this.screen['line' + module.line].removeWriter(module);
        module.line = args.line;
        module.start = args.start;
        module.end = args.end;
        this.screen['line' + module.line].setWriter(module);
        this.modules.push(module)
    }

    this.applicationLoop = ()  => {
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
    }

    this.printBootingMessage = () => {
        this.lcd.clear();
        this.lcd.println('\x04 INICIALIZANDO \x05', 2, true);
    }

};