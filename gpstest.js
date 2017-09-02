
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

var file = '/dev/ttyUSB0';

const SerialPort = require('serialport');
const parsers = SerialPort.parsers;

const parser = new parsers.Readline({
    delimiter: '\r\n'
});

const port = new SerialPort(file, {
    baudRate: 9600
});

port.pipe(parser);

app.get('/', function(req, res) {
    res.sendFile(__dirname+'/node_modules/gps/examples/dashboard/dashboard.html');
});

var GPS = require('gps');
var gps = new GPS;

http.listen(3000, function() {

    console.log('listening on *:3000');

    gps.on('data', function() {
        io.emit('state', gps.state);
    });

    parser.on('data', function(data) {
        gps.update(data);
    });
});


