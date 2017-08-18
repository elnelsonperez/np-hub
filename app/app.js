const line = require('./core/line.js');
const getSerial = require('./../lib/systeminfo').getSerial()
const fs = require('fs');
const Lcdlib = require('../lib/lcd');
const serialManager = require('./../lib/serial').SerialManager;
const GprsManager =  require('./../lib/gprs').GprsManager;

app = function () {
    this.screen = null
    this.lcd = null
    this.modules = []
    this.timer = null
    this.injectable = {}
    this.publicProperties = {
        serial : null
    }

    this.initialize = () => {
        this.publicProperties.serial = getSerial();
        this.setDefaultApplicationProperties();
        this.lcd = new Lcdlib.LcdController( 1, 0x3f, 20, 4 );
        this.lcd.customChar();
        const SerialManager = new serialManager(true);
        this.injectable.SerialManager = SerialManager;
        this.injectable.GprsManager = new GprsManager(SerialManager);
        this.printBootingMessage();

        //load modules
        this.loadModules(__dirname+'/modules/default');
        this.applicationLoop()
    }

    this.switchModuleDomain =  (folder) => {
        if (this.timer)
            clearInterval(this.timer);

        this.setDefaultApplicationProperties();

        for (let module of this.modules) {
            module.removeAllListeners()
        }

        //load modules
        this.loadModules(__dirname+'/modules/'+folder);
        // this.lcd.stopScroll() //Only one scroll at a time.
        this.applicationLoop()
    }

    this.setDefaultApplicationProperties = () => {
        this.screen = {
            line1: new line(),
            line2: new line(),
            line3: new line(),
            line4: new line()
        };
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

                    module.publicProperties = this.publicProperties

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

    this.printSingleLine  = (line, number) => {
        if (!this.screen['line'+number].scrolling)
            this.lcd.println(line, number);
        else if (!this.screen['line'+number].scrollingStarted) {
            this.lcd.printlnScroll(line,number);
            this.screen['line'+number].scrollingStarted = true;
        }
    }

    this.applicationLoop = ()  => {
        this.timer = setInterval(() => {
            const contents = {};
            for (let i = 1; i<=4;i++) { //Get Parsed Lines
                contents[i] = this.screen['line'+i].getProcessedLine()
            }
            Object.keys(contents).forEach((key) => {
                this.printSingleLine(contents[key], key);
            })

        }, 450)
    }

    this.printBootingMessage = () => {
        this.lcd.clear();
        this.lcd.println('\x04 INICIALIZANDO \x05', 2, true);
    }

};
module.exports.Application = app;