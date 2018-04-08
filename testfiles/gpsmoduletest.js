
const SerialPort = require('serialport');
const GPS = require('gps');
const file = '/dev/serial/by-id/usb-u-blox_AG_-_www.u-blox.com_u-blox_6_-_GPS_Receiver-if00';
const parsers = SerialPort.parsers;
const service = require('./../app/services/TimeSyncService')
const time = new service()
const parser = new parsers.Readline({
  delimiter: '\r\n'
});

const port = new SerialPort(file, {
  baudRate: 9600
});

port.pipe(parser);

const gps = new GPS;
parser.on('data', function(data) {
  try {
    gps.update(data);
  } catch (e) {
    console.log(e)
  }
});


gps.on('ZDA', (parsed) => {
  time.setGpsTime(parsed.time)
  time.setSystemTime()
});