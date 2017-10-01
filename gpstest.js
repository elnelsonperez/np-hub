const file = '/dev/ttyUSB0';
const SerialPort = require('serialport');
const parsers = SerialPort.parsers;

const parser = new parsers.Readline({
    delimiter: '\r\n'
});

const port = new SerialPort(file, {
    baudRate: 9600
});
port.pipe(parser);

var GPS = require('gps');

var gps = new GPS;
gps.on('data', function(parsed) {
    console.log(parsed)
});
parser.on('data', function(data) {
    gps.update(data);
});


