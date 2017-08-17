const SerialPort = require('serialport');
const port = new SerialPort('/dev/ttyS0');
const Readline = SerialPort.parsers.Readline;
const parser = new Readline();
port.pipe(parser);
parser.on('data', console.log);
port.write('AT\r\n');