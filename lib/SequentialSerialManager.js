const SerialPort = require('serialport');
const parsers = SerialPort.parsers;


/**
 * This object allows you to send serial commands that expect a certain response. If such response is not
 * obtained after a timeout, a user defined function is called.
 */
module.exports.SequentialSerialManager = function (debug) {

    this.port= null
    this.busy= false
    this.queue= []
    this.current= null
    this.currentResponse= []
    this.afterDelimiterCounter = 0
    this.currentTimeoutId= null

    this.initialize  = (debug = false) => {
        this.port = new SerialPort('/dev/ttyS0', {
            baudRate: 19200
        });

        const parser = new parsers.Readline({
            delimiter: '\r\n'
        });


        if (debug) {
            const parser = new parsers.Readline({
                delimiter: '\r\n'
            });
            parser.on('data', (data) => {
                console.log(data,'\n--------------------------')
            });
            this.port.pipe(parser);
        }

        parser.on('data', (data) => {
            this.dataReceived(data, this)
        });

        this.port.pipe(parser);

        this.port.on('error', function(err) {
            console.log('Error: ', err.message);
        });
    }

    /**
     * Pushes a command in the command queue to be sent.
     * @param cmd
     * @param timeout
     * @param alwaysresolve
     * @param expect
     * @param afterdelimiter
     * @param delimiter
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

    this.dataReceived = (data) => {
        if (this.current) {
            if (data !== this.current.cmd) {
                this.currentResponse.push(data);
                this.restartTimeout();

                if ((data === this.current.delimiter || data.includes('ERROR')) || this.current.afterdelimiter !== 0) {
                    if (this.afterDelimiterCounter >= this.current.afterdelimiter) {
                        if (this.current.resolve) {
                            this.current.res({cmd: this.current.cmd, res: this.currentResponse});
                        } else {
                            if (Array.isArray(this.current.expect)) {
                                this.current.expect.forEach((response) => {
                                    if (this.currentResponse.includes(response)) {
                                        this.current.res({cmd: this.current.cmd, res: this.currentResponse});
                                    }
                                })
                            } else {
                                if (this.currentResponse.includes(this.current.expect)) {
                                    this.current.res({cmd: this.current.cmd, res: this.currentResponse});
                                } else {
                                    this.current.rej({cmd: this.current.cmd, res: this.currentResponse});
                                }
                            }
                        }

                        this.currentResponse = [];
                        this.afterDelimiterCounter = 0;
                        clearTimeout(this.currentTimeoutId);
                        this.currentTimeoutId = null;
                        this.processQueue();


                    } else {
                        this.afterDelimiterCounter += 1;
                    }
                }

            }
        }
    }

    this.processQueue =() => {
        const next = this.queue.shift();
        if (!next) {
            this.busy = false;
            return;
        }
        this.current = next;
        this.port.write(next.cmd+'\r\n');
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
        },this.current.timeout)
    }

    this.initialize(arguments);

};