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

/**
 * Engine de la aplicacion.
 * Hace todos los setup iniciales necesarios y se encarga de correr las tasks
 * periodicamente.
 * @constructor
 */
Application = function () {
  this.screen = null //4 Line objects basically
  this.lcd = null //Lcd library
  this.timer = null //Lcd update timer
  this.modules = {} //LCD Module list
  this.tasks = {} //Task list
  this.injectable = {} //Services which are injectable to modules or tasks
  
  this.screenConfigs = null; 
  this.disabledFunctionality = {}
  this.screenRefreshDelay = 500;

  /**
   * Inicializador de la app.
   * @param defaultModule Relacionado con las LCDs. Ignore.
   * @param disabledFunctionality Simplemente utilizado para desactivar partes de la app.
   * Por ahora solo desactiva la LCD.
   * @param inputPins Pines a registrar en el InputManager
   * @param inputDelay Cada cuanto checar el estado de los inputs registrados
   * @param screenRefreshDelay Cada cuanto refrescar la LCD. Ingore.
   * @param services Servicios de la aplicacion
   */
  this.initialize = (
    {
      defaultModule = 'boot', 
      disabledFunctionality = { lcd: false }, 
      inputPins = {},
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
    this.setDefaultLcdProperties();

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

    //Loads tasks from tasks directory
    this.loadTasks(__dirname+'/tasks');

    //Init lcd modules, if lcd enabled.
    if (lcdEnabled) {
      this.loadModules(__dirname+'/modules/' + defaultModule).then(() => {
          //Print to screen.
          this.lcdPrintLoop()
          this.runTasks();
          //Input monitoring
          props.input.monitorRegisteredPins()
        }
      );
    }
    else {
      this.runTasks();
      //Input monitoring
      props.input.monitorRegisteredPins()
    }

    //Cargar bluetooth y gprs, luego, iniciar bridge service para interactuar con app movil.
    this.injectable.HardwareLoaderService.load().then(() => {
      this.injectable.BridgeService.start()
    })

  }

  /**
   * Parsea los argumentos pasados a la app al correrla.
   * @return {{verbose: boolean, bridgeDebug: boolean, noLocations: boolean, noAuth: boolean, hideGprs: boolean}}
   */
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

  /**
   * Verifica si la aplicacion ha sido desactivada remotamente.
   * @param config
   */
  this.checkIfDisabled = function (config) {
    if (config && config.enabled === false ) {
      shutdown()
    }
  }

  /**
   * Se encarga de correr todos los tasks en el directorio de Tasks.
   */
  this.runTasks = function () {
    for (let task of Object.keys(this.tasks)) { //Para cada task
      const runtask = () => {
        if (this.tasks[task].every) { //Si el task tiene un "every"
          interval(async () => { //Correr su funcion 'run' cada every milisegundos.
            if (this.tasks[task].ready) { //Siempre y cuando el task este 'ready' para ser corrida.
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
   * @param dir Directorio donde residen las Tasks
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
   * Changes directory of loaded modules. Changes screen.
   * @param folder
   */
  this.switchModuleDomain =  (folder) => {
    if (this.timer)
      clearInterval(this.timer);

    this.lcd.stopScroll()
    this.setDefaultLcdProperties();

    for (let module of Object.keys(this.modules)) {
      this.modules[module].removeAllListeners()
    }
    //load modules
    this.loadModules(__dirname+'/modules/'+folder);
    // this.lcd.stopScroll() //Only one scroll at a time.
    this.lcdPrintLoop()
  }


  //De aqui en adelante son metodos de la LCD. Ya no se usan.. Por ahora.
  //Esto deberia estar en otro lado dedicado a la LCD, pero bueh.

  this.setDefaultLcdProperties = () => {
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
      this.setDefaultLcdProperties();
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

/**
 * Agregando finally al prototipo de las promesas.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally
 */

Promise.prototype.finally = function(cb) {
  const res = () => this
  const fin = () => Promise.resolve(cb()).then(res)
  return this.then(fin, fin);
};

/**
 * Cualquier error no manejado en la aplicacion sera logueado en vez de explotar la app.
 */
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

/**
 * Simplemente para saber cuando la app ha terminado el proceso de 'booteo'
 */
props.applicationEvent.on('boot.ready', function () {
  console.log(" ==== BOOT READY ====\n")
})

/**
 * Asegurarse que cuando se cierre la aplicacion, el proceso de Python que maneja el bluetooth tambien muera.
 */
process.on('SIGINT', function() {
  app.injectable.BluetoothService.shell.childProcess.kill();
  process.exit();
});

module.exports.Application = Application;