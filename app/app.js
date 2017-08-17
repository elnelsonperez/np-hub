const line = require('./core/line.js');
const fs = require('fs');
const Lcdlib = require('../lib/lcd');
const serialManager = require('./../lib/serial').SerialManager;
const GprsManager =  require('./../lib/gprs').GprsManager;

module.exports.Application = app;
app = function () {
    this.screen = null
    this.lcd = null
    this.modules = []
    this.timer = null
    this.injectable = {}

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

    this.printSingleLine  = (line, number) => {
        if (!this.screen['line'+number].scrolling)
            this.lcd.println(line,1);
        else if (!this.screen['line'+number].scrollingStarted) {
            this.lcd.printlnScroll(line,number);
            this.screen['line'+number].scrollingStarted = true;
        }
    }

    this.applicationLoop = ()  => {
        this.timer =  setInterval(() => {
            const contents = {};

            for (let i = 1; i<=4;i++) { //Get Parsed Lines
                contents[i] = this.screen['line'+i].getProcessedLine()
            }

            for (let [line, content] of contents) { //Actually print them
                this.printSingleLine(content, line);
            }

        }, 450)
    }

    this.printBootingMessage = () => {
        this.lcd.clear();
        this.lcd.println('\x04 INICIALIZANDO \x05', 2, true);
    }

};