const Task  = require('../core/Task').Task
const props = require('./../shared/props')

const TimeSyncTask = new Task (
    {
      name: 'TimeSyncTask',
      every: 20000,
      inject: ['TimeSyncService'],
      ready: true
    }
);

TimeSyncTask.run = async function () {
  let date = this.TimeSyncService.setSystemTime()
  if (date !== null) {
    props.timeSynced = true
    console.log("||||||||||||||||| SETTING SYSTEM TIME: "+ date)
  }
}

module.exports = TimeSyncTask;