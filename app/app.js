const line = require('./core/line.js');
const getSerial = require('./../lib/systeminfo').getSerial
const fs = require('fs');
const Lcdlib = require('../lib/lcd');
const SequentialSerialManager = require('./../lib/serial').SequentialSerialManager;
const GprsManager =  require('./../lib/gprs').GprsManager;
const EventEmitter = require('events').EventEmitter
const IbuttonReader = require('./../lib/ibutton').IbuttonReader

app = function () {
    this.screen = null //4 Line objects basically
    this.lcd = null //Lcd library
    this.modules = [] //Module list
    this.tasks = [] //Task list
    this.timer = null
    this.injectable = {} //Which libraries are injectable to modules or tasks
    this.screenConfigs = null;
    this.publicProperties = { //These are available to all modules and tasks
        serial : null, //Pi serial number
        auth: {
          users: [],
          config: {
              requireAll: false
          }
        },
        appEvent: null
    }

    this.initialize = (defaultModule = 'boot') => {
        this.publicProperties.appEvent = new EventEmitter()
        this.publicProperties.serial = getSerial();
        this.setDefaultApplicationProperties();

        this.lcd = new Lcdlib.LcdController( 1, 0x3f, 20, 4 );
        this.lcd.customChar();

        const Seq = new SequentialSerialManager(true);
        this.injectable.SequentialSerialManager = Seq;
        this.injectable.GprsManager = new GprsManager(Seq);
        this.injectable.IbuttonReader = new IbuttonReader({});
        this.printBootingMessage();

        //Loads tasks
        this.loadTasks(__dirname+'/tasks');

        //loads modules
        this.loadModules(__dirname+'/modules/'+defaultModule);

        //Stats tu run tasks
        this.runTasks();

        //Aplication loop
        this.applicationLoop()
    }

    this.runTasks = function () {
        for (let task of Object.keys(this.tasks)) { //Para cada task
            if (this.tasks[task].autoload) { //Si el task quiere cargarse automaticamente
                this.tasks[task].run(); //Correr el task la primera vez
            }
            if (this.tasks[task].every) { //Si el task tiene un "every"
                setInterval(() => {
                 if (this.tasks[task].ready === true) {
                    this.tasks[task].run.bind(this.tasks[task])()
                    }
                }, this.tasks[task].every) //Correr cada "every" milisegundos
            }

        }
    }

    /**
     * Loads and initializes tasks
     * @param dir
     */
    this.loadTasks = function (dir) {
        fs.readdirSync(dir).forEach(file => {
            const task = require(dir+'/'+file);
            if (task) {
                task.publicProperties = this.publicProperties
                if (task.initialize) {
                    task.initialize()
                }
                for (let injectable of task.inject) {
                        if (this.injectable[injectable]) {
                            task[injectable] = this.injectable[injectable];
                    }
                }

                task.siblingTasks = this.tasks;
                this.tasks[task.name] = task;
            }
        });
    }

    /**
     * Changes directory of loaded modules. Changes screen
     * @param folder
     */
    this.switchModuleDomain =  (folder) => {
        if (this.timer)
            clearInterval(this.timer);

        this.lcd.stopScroll()
        this.setDefaultApplicationProperties();

        for (let module of Object.keys(this.modules)) {
            this.modules[module].removeAllListeners()
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
        this.screenConfigs = null;
        this.modules = {};
    }

    this.loadModules = (dir, clearModules = false) => {
        if (clearModules === true) {
            this.setDefaultApplicationProperties();
        }
        try {
            fs.readdirSync(dir).forEach(file => {
                const module = require(dir+'/'+file);
                if (file === 'config.js') {
                    this.screenConfigs = module;
                } else {
                    if (module) {
                        for (let injectable of module.inject) {
                            if (injectable.type && injectable.type === "task") {
                              if (injectable.name && this.tasks[injectable.name]) {
                                module[injectable.name] = this.tasks[injectable.name];
                              }
                            } else {
                              if (this.injectable[injectable]) {
                                module[injectable] = this.injectable[injectable];
                              }
                            }
                        }

                        module.publicProperties = this.publicProperties

                        if (module.initialize) {
                            module.initialize()
                        }

                        module.on('changeLine', this.changeModuleLine)
                        this.screen['line' + module.line].setWriter(module);
                        this.modules[module.name] = module;
                    }
                }
            });

        } catch (e) {
            console.log(e)
            //TODO Handle this better
        }
    }

    this.changeModuleLine = (module, args) => {
        this.screen['line' + module.line].removeWriter(module);
        module.line = args.line;
        module.start = args.start;
        module.end = args.end;
        this.screen['line' + module.line].setWriter(module);
    }

    this.printSingleLine  = (line, number) => {
        if (!this.screen['line'+number].scrolling){
            if (this.screenConfigs && this.screenConfigs.linesNotCentered &&
                this.screenConfigs.linesNotCentered.includes(parseInt(number))) {
                this.lcd.println(line, number, false);
            } else {
                this.lcd.println(line, number, true);
            }
        }
        else {
            if (this.screen['line'+number].changed)  {
              this.lcd.stopScroll(number)
              this.lcd.printlnScroll(line,number);
            }

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

        }, 500)
    }

    this.printBootingMessage = () => {
        this.lcd.clear();
        this.lcd.println('\x04 INICIALIZANDO \x05', 2, true);
    }

};

module.exports.Application = app;