const SerialPort = require('serialport');
const parsers = SerialPort.parsers;
const util = require('util')
const events = require('events')
const props = require('./../app/shared/props')
/**
 * This object allows you to send serial commands that expect a certain response. If such response is not
 * obtained after a timeout, a user defined function is called.
 */

const SequentialSerialManager = function (debug) {

  this.port = null
  this.busy = false
  this.queue = []
  this.current = null
  this.currentResponse = []
  this.afterDelimiterCounter = 0
  this.currentTimeoutId = null

  this.initialize  = () => {
    this.port = new SerialPort('/dev/serial0', {
      baudRate: 115200
    });

    const parser = new parsers.Readline({
      delimiter: '\r\n'
    });

    parser.on('data', (data) => {

      if (this.current) {
        this.dataReceived(data, this)
        if (!props.argv.hideGprs) {
          console.log(data)
          if (data === this.current.cmd) {
            console.log('-------------------------')
          }
          else if (this.currentResponse.length === 0) {
            console.log('=========================')
          }
        }
      } else {
        this.processQueue()
      }

    });

    this.port.pipe(parser);

    this.port.on('error', function(err) {
      console.log('Error: ', err.message);
    });
  }

  /**
   * Pushes a command in the command queue to be sent.
   * @param cmd Comando a ejecutar
   * @param timeout Tiempo a esperar por una respuesta
   * @param alwaysresolve Siempre resolver la promesa
   * @param expect Respuesta a esperar para completar comando
   * @param afterdelimiter Mensajes a esperar luego del delimitador especificado para este comando
   * @param delimiter delimitador. Por defecto, OK
   * @returns {Promise}
   */
  this.send = ({cmd, timeout = 4000, alwaysresolve = false,  expect = 'OK', afterdelimiter = 0, delimiter = 'OK'}) => {
    return new Promise((res, rej) => {
      this.queue.push(
          {   cmd: cmd,
            res: res,
            rej: rej,
            timeout: timeout,
            expect: expect,
            resolve: alwaysresolve,
            delimiter: delimiter,
            afterdelimiter: afterdelimiter
          });

      if (this.busy) return;
      this.busy = true;
      this.processQueue();
    });

  }

  this.checkForSpecialMessages  = (data) => {
     const messages = [
       "+SAPBR 1: DEACT",
       "PDP: DEACT"
     ];
    if (messages.includes(data)) {
      this.emit('specialMessage', data)
      return true;
    }
    return false;
  }

  this.resetParams = ()  => {
    this.currentResponse = [];
    this.afterDelimiterCounter = 0;
    clearTimeout(this.currentTimeoutId);
    this.currentTimeoutId = null;
    this.processQueue();
  }

  this.findExpectInResponses = () => {
    //Si son varios valores esperados
    if (Array.isArray(this.current.expect)) {
      this.current.expect.forEach((response) => {
        if (this.currentResponse.includes(response)) {
          this.current.res({cmd: this.current.cmd, res: this.currentResponse});
        }
      })
      this.current.rej({cmd: this.current.cmd, res: this.currentResponse});
      this.resetParams()
    }
    //Si es uno
    else {
      if (this.currentResponse.includes(this.current.expect)) {
        this.current.res({cmd: this.current.cmd, res: this.currentResponse});
      } else {
        this.current.rej({cmd: this.current.cmd, res: this.currentResponse});
      }
      this.resetParams()
    }
  }

  this.dataReceived = (data) => {
    if (!this.checkForSpecialMessages(data)) {
      if (this.current) { //Hay un comando esperando respuesta
        if (data !== this.current.cmd) { //Si la respuesta no es un echo
          this.currentResponse.push(data);
          this.restartTimeout();

          if (data === "ERROR") {
            this.findExpectInResponses()
            return;
          }

          //Si la respuesta es el delimitador de comandos seteado
          if (data === this.current.delimiter && this.current.afterdelimiter === 0) {
            if (this.current.resolve) {
              this.current.res({cmd: this.current.cmd, res: this.currentResponse});
              this.resetParams()
            }
            else {//Buscar valor esperado para comando en arreglo de respuesta
              this.findExpectInResponses()
            }
          }
          else if ( this.current.afterdelimiter !== 0) {
            if (data === this.current.delimiter) {
              this.afterDelimiterCounter += 1;
            }
            else {
              if (this.afterDelimiterCounter === this.current.afterdelimiter) {
                if (this.current.resolve) {
                  this.current.res({cmd: this.current.cmd, res: this.currentResponse});
                  this.resetParams()
                }
                else {
                  this.findExpectInResponses()
                }
              }
              else {
                this.afterDelimiterCounter += 1;
              }
            }
          }
        }
      }
    }
  }


  this.processQueue = () => {
    const next = this.queue.shift();
    if (!next) {
      this.busy = false;
      return;
    }
    this.current = next;

      this.port.write(next.cmd+'\n');
      this.startTimeout()


  }

  this.restartTimeout  = () => {
    clearTimeout(this.currentTimeoutId);
    this.startTimeout();
  }

  this.startTimeout = () => {
    this.currentTimeoutId = setTimeout(() => {
      if (this.busy) {
        this.busy = false;
        this.currentResponse = [];
        this.afterDelimiterCounter = 0;
        console.log('Timeout exceeded for '+this.current.cmd);
        this.current.rej({message: 'Timeout exceeded for '+this.current.cmd});
        this.current = null;
        this.processQueue();
      }
    }, this.current.timeout)
  }

  this.initialize(arguments)
};

util.inherits(SequentialSerialManager,events.EventEmitter)
module.exports = SequentialSerialManager;
