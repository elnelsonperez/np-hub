const line = require('./core/line.js');
const getSerial = require('./../lib/systeminfo').getSerial
const fs = require('fs');
const Lcdlib = require('../lib/lcd');
const SequentialSerialManager = require('./../lib/serial').SequentialSerialManager;
const GprsManager =  require('./../lib/gprs').GprsManager;
const EventEmitter = require('events').EventEmitter

app = function () {
    this.screen = null
    this.lcd = null
    this.modules = []
    this.tasks = []
    this.timer = null
    this.injectable = {}
    this.publicProperties = {
        serial : null
    }

    this.appEvent = new EventEmitter()

    this.initialize = (defaultModule = 'boot') => {
        this.publicProperties.serial = getSerial();
        this.setDefaultApplicationProperties();

        this.lcd = new Lcdlib.LcdController( 1, 0x3f, 20, 4 );
        this.lcd.customChar();

        const SequentialSerialManager = new SequentialSerialManager(true);
        this.injectable.SequentialSerialManager = SequentialSerialManager;
        this.injectable.GprsManager = new GprsManager(SequentialSerialManager);

        this.printBootingMessage();
        //
        // this.loadTasks(__dirname+'/tasks');
        // this.runTasks ();
        //load modules
        this.loadModules(__dirname+'/modules/'+defaultModule);
        this.applicationLoop()
    }

    this.runTasks = function () {
        for (let task of this.tasks) {
            if (task.autoload) {
                task.run();

                if (task.every) {
                    setInterval(task.run, task.every)
                }

            }
        }
    }

    this.loadTasks = function (dir) {
        fs.readdirSync(dir).forEach(file => {
            const task = require(dir+'/'+file);
            if (task) {
                task.publicProperties = this.publicProperties
                if (task.initialize) {
                    task.initialize()
                }
                this.tasks.push(task)
            }
        });
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
                    module.appEvent = this.appEvent;

                    if (module.initialize) {
                        module.initialize()
                    }

                    module.on('changeLine', this.changeModuleLine)
                    this.screen['line' + module.line].setWriter(module);
                    this.modules.push(module)
                }


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
        // this.modules.push(module)
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