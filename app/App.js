const line = require('./core/Line.js');
const getSerial = require('./../lib/systeminfo').getSerial
const fs = require('fs');
const Lcdlib = require('../lib/LcdController');
const SequentialSerialManager = require('../lib/SequentialSerialManager').SequentialSerialManager;
const GprsManager =  require('../lib/GprsManager').GprsManager;
const EventEmitter = require('events').EventEmitter
const IbuttonReader = require('../lib/IbuttonReader').IbuttonReader
const InputHandler = require('./../lib/InputHandler').InputHandler
const RequestQueueService = require("./services/RequestQueueService")
const RequestProcessorService = require("./services/RequestProcessorService")
const BluetoothService = require("./services/BluetoothService/BluetoothService")

const SCREEN_REFRESH_DELAY = 500;
const INPUT_DELAY = 150;

Application = function () {
    this.screen = null //4 Line objects basically
    this.lcd = null //Lcd library
    this.timer = null //Lcd update timer

    this.modules = {} //Module list
    this.tasks = {} //Task list
    this.injectable = {} //Which libraries are injectable to modules or tasks

    this.screenConfigs = null;
    this.currentModuleDomain = null;
    this.disabledFunctionality = {
        lcd: false
    }

    this.props = { //These are available to all modules and tasks
        applicationEvent: null,
        config: {
            distanceBetweenLocations: 10, //meters
            timeoutSendLocation: 5 //Minutes
        },
        input: null,
        serial : null, //Pi serial number
        auth: {
            users: [],
            config: {
                requireAll: false
            }
        },
    }

    this.initialize = (defaultModule = 'boot') => {
        this.currentModuleDomain = defaultModule;
        const lcdEnabled = this.disabledFunctionality.lcd === false
        const inputHandler = new InputHandler(INPUT_DELAY);
        inputHandler.registerInputPins(
            {
                pins: [
                    {
                        type: InputHandler.TYPE_PUSH_BUTTON,
                        number: 33,
                        name: 'showAuth'
                    }
                ]
            }
        )
        inputHandler.initializeRegisteredPins();
        this.props.input = inputHandler

        this.props.applicationEvent = new EventEmitter()
        this.props.serial = getSerial();
        this.setDefaultApplicationProperties();

        this.lcd = new Lcdlib.LcdController(1, 0x3f, 20, 4);
        this.lcd.customChar();

        const Seq = new SequentialSerialManager(true);
        this.injectable.SequentialSerialManager = Seq;
        this.injectable.GprsManager = new GprsManager(Seq);
        this.injectable.IbuttonReader = new IbuttonReader({});
        this.injectable.BluetoothService = new BluetoothService()
        this.injectable.RequestQueueService = new RequestQueueService()
        this.injectable.RequestProcessorService = new RequestProcessorService(
            this.injectable.RequestQueueService,
            this.injectable.GprsManager
        )
        if (lcdEnabled)
            this.printBootingMessage();

        //Loads tasks
        this.loadTasks(__dirname+'/tasks');

        if (lcdEnabled) {
            this.loadModules(__dirname+'/modules/'+defaultModule).then(() => {
                    //Stats to run tasks
                    this.runTasks();
                    //Input
                    this.props.input.monitorRegisteredPins()

                    if (lcdEnabled) {
                        this.lcdPrintLoop()
                    }
                }
            )
        }
        else {
            //Stats to run tasks
            this.runTasks();
            //Input
            this.props.input.monitorRegisteredPins()

        }

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
                task.props = this.props
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

        this.currentModuleDomain = folder;
        //load modules
        this.loadModules(__dirname+'/modules/'+folder);
        // this.lcd.stopScroll() //Only one scroll at a time.
        this.lcdPrintLoop()
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

    this.loadModules = async (dir, clearModules = false) => {
        if (clearModules === true) {
            this.setDefaultApplicationProperties();
        }

        fs.readdirSync(dir).forEach(file => {
            const module = require(dir+'/'+file);
            if (file === 'config.js') {
                this.screenConfigs = module;
            } else {
                if (module) {
                    this.modules[module.name] = module;
                }
            }
        });

        for (let moduleName of Object.keys(this.modules)) {
            let module = this.modules[moduleName];
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

            module.props = this.props

            if (module.initialize) {
                await module.initialize()
            }

            module.on('changeLine', this.changeModuleLine)
            this.screen['line' + module.line].setWriter(module);

            if(module.dependsOn) {
                if (this.modules[module.dependsOn]) {
                    module.parentModule = this.modules[module.dependsOn];
                } else throw new Error('Module dependency cannot be met for '+module.dependsOn+' in '+this.modules[module].name)

            }
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

    this.lcdPrintLoop = ()  => {
        this.timer = setInterval(() => {
            const contents = {};
            for (let i = 1; i<=4;i++) { //Get Parsed Lines
                contents[i] = this.screen['line'+i].getProcessedLine()
            }

            Object.keys(contents).forEach((key) => {
                this.printSingleLine(contents[key], key);
            })
        }, SCREEN_REFRESH_DELAY)
    }

    this.printBootingMessage = () => {
        this.lcd.clear();
        this.lcd.println('\x04 INICIALIZANDO \x05', 2, true);
    }

};

module.exports.Application = Application;