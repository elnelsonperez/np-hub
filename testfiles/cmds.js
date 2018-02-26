const readline = require('readline');
const SerialPort = require('serialport');
const parsers = SerialPort.parsers;
const rl = readline.createInterface({

  input: process.stdin,
  terminal: false
});

this.port = new SerialPort('/dev/serial0', {
  baudRate: 9600
});

const parser = new parsers.Readline({
  delimiter: '\r\n'
});

let cmd = null;
parser.on('data', (data) => {
  if (data !== cmd) {
    console.log(data)
    console.log("===================")
  }

});

this.port.pipe(parser);

this.port.on('error', function(err) {
  console.log('Error: ', err.message);
});

rl.on('line', (line) => {
  cmd = line;
  this.port.write(line+"\n")
})
