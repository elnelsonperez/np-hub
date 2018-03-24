const EventEmitter = require('events').EventEmitter
const fs = require('fs');

const line = require('./core/Line.js');
const Lcdlib = require('../lib/LcdController');
const InputManager = require('./core/InputManager')

const props = require('./shared/props')
const interval = require('interval-promise')

const getSerial = require('./../lib/systeminfo').getSerial
const minimist = require('minimist');

const reset = require('./../lib/functions').reset;
const shutdown = require('./../lib/functions').shutdown;

Application = function () {
  this.screen = null //4 Line objects basically
  this.lcd = null //Lcd library
  this.timer = null //Lcd update timer
  this.modules = {} //Module list
  this.tasks = {} //Task list
  this.injectable = {} //Which services are injectable to modules or tasks

  this.screenConfigs = null;
  this.disabledFunctionality = {}
  this.screenRefreshDelay = 500;

  this.initialize = (
    {
      defaultModule = 'boot',
      disabledFunctionality = { lcd: false },
      inputPins= {},
      inputDelay = 150,
      screenRefreshDelay = 500,
      services = {}
    }
  ) => {
    props.applicationEvent = new EventEmitter()

    this.screenRefreshDelay = screenRefreshDelay
    this.disabledFunctionality = disabledFunctionality

    props.argv = this.parseArguments()

    const InputManager = new InputManager({delay: inputDelay});
    InputManager.registerInputPins(inputPins)
    InputManager.initializeRegisteredPins().then(()=> {
      props.input = InputManager
    });

    props.serialNumber = getSerial();
    this.setDefaultApplicationProperties();

    this.lcd = new Lcdlib.LcdController(1, 0x3f, 20, 4);
    this.lcd.customChar();
    const lcdEnabled = this.disabledFunctionality.lcd === false
    if (lcdEnabled)
      this.printBootingMessage();

    this.injectable = services;

    props.applicationEvent.once('config.ready', config => {
      console.log("======== CONFIG LOADED ==========")
      this.checkIfDisabled(config)
      props.config = config
    })

    props.applicationEvent.on("config.update", config => {
      this.checkIfDisabled(config)
      props.config = config
    })

    //Loads tasks
    this.loadTasks(__dirname+'/tasks');

    //Init rest
    if (lcdEnabled) {
      this.loadModules(__dirname+'/modules/' + defaultModule).then(() => {
          //Print to screen.
          this.lcdPrintLoop()
          this.runTasks();
          //Input
          props.input.monitorRegisteredPins()
        }
      );
    }
    else {
      this.runTasks();
      //Input
      props.input.monitorRegisteredPins()
    }

    //Hardware loader
    this.injectable.HardwareLoaderService.load().then(() => {
      this.injectable.BridgeService.start()
    })

  }

  this.parseArguments = function () {
    const argv = minimist(process.argv.slice(2));
    return {
      verbose: !!argv.verbose,
      bridgeDebug: !!argv.bridgeDebug,
      noLocations: !!argv.noLocations,
      noAuth: !!argv.noAuth,
      hideGprs: !!argv.hideGprs
    };
  }

  this.checkIfDisabled = function (config) {
    if (config && config.enabled === false ) {
      shutdown()
    }
  }

  this.runTasks = function () {
    for (let task of Object.keys(this.tasks)) { //Para cada task
      const runtask = () => {
        if (this.tasks[task].every) { //Si el task tiene un "every"
          interval(async () => {
            if (this.tasks[task].ready) {
              if (props.argv.verbose) {
                console.log("-> Running '"+this.tasks[task].name+"'\n")
              }
              await this.tasks[task].run()
            }
          }, this.tasks[task].every)
        }
      }

      if (this.tasks[task].autoload) { //Si el task quiere cargarse automaticamente
        this.tasks[task].run().then(() => {runtask()}); //Correr el task la primera vez
      }
      else {
        runtask()
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

        for (let injectable of task.inject) {
          if (this.injectable[injectable]) {
            task[injectable] = this.injectable[injectable];
          }
        }
        this.tasks[task.name] = task;
        if (task.initialize) {
          task.initialize()
        }
      }
    });

    for (let key of Object.keys(this.tasks)) {
      this.tasks[key].siblingTasks = this.tasks;
    }

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
    }, this.screenRefreshDelay)
  }

  this.printBootingMessage = () => {
    this.lcd.clear();
    this.lcd.println('\x04 INICIALIZANDO \x05', 2, true);
  }

};

Promise.prototype.finally = function(cb) {
  const res = () => this
  const fin = () => Promise.resolve(cb()).then(res)
  return this.then(fin, fin);
};

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

props.applicationEvent.on('boot.ready', function () {
  console.log(" ==== BOOT READY ====\n")
})

process.on('SIGINT', function() {
  app.injectable.BluetoothService.shell.childProcess.kill();
  process.exit();
});

module.exports.Application = Application;