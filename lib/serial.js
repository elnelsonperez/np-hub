const SerialPort = require('serialport');
const parsers = SerialPort.parsers;

module.exports.SequentialSerialManager = function (debug) {

    this.port = null
    this.busy= false
    this.queue=[]
    this.current= null
    this.currentResponse= []
    this.afterOkCounter= 0
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

    this.send = ({cmd, timeout = 4000, alwaysresolve = false,  expect = 'OK', afterok = 0}) => {

        return new Promise((res, rej) => {
            this.queue.push(
                {cmd: cmd,
                    res: res,
                    timeout: timeout,
                    rej: rej,
                    expect: expect,
                    resolve: alwaysresolve,
                    afterok:afterok});
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

                if ((data === 'OK' || data.includes('ERROR')) || this.current.afterok !== 0) {
                    if ( this.afterOkCounter >= this.current.afterok) {

                        if (this.current.resolve) {
                            this.current.res({cmd: this.current.cmd, res: this.currentResponse});
                        } else {

                            if (Array.isArray(this.current.expect)) {
                                this.current.expect.forEach((val) => {
                                    if (this.currentResponse.includes(val)) {
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
                        this.afterOkCounter = 0;
                        clearTimeout(this.currentTimeoutId);
                        this.currentTimeoutId = null;
                        this.processQueue();


                    } else {
                        this.afterOkCounter += 1;
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
                this.afterOkCounter = 0;
                console.log('Timeout exceeded for '+this.current.cmd);
                this.current.rej({message: 'Timeout exceeded for '+this.current.cmd});
                this.current = null;
                this.processQueue();
            }
        },this.current.timeout)
    }

    this.initialize(arguments);

};