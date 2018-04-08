const util = require('util')
const EventEmitter = require('events').EventEmitter
const Moment = require('moment-timezone');

const TimeSyncService = function () {

  this.time = null;

  this.setGpsTime = (time) => {
    this.time = time;
  }

  this.setSystemTime = () => {
    if(this.time !== null) {
     const date = Moment(this.time).tz('America/Santo_Domingo').format("YYYY-MM-DD HH:mm:ss");
      require('child_process').exec('sudo date +"%Y-%m-%d %T" -s "'+date+'"');
      return date;
    }
    return null
  }
}

util.inherits(TimeSyncService, EventEmitter)
module.exports = TimeSyncService;