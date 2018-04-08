const Task  = require('../core/Task').Task
const props = require('./../shared/props')

const TimeSyncTask = new Task (
    {
      name: 'TimeSyncTask',
      every: 2*60*60,
      inject: ['TimeSyncService'],
      ready: true
    }
);

TimeSyncTask.run = function () { return new Promise(res => {
  let date = this.TimeSyncService.setSystemTime()
  while (date === null)  {
        date = this.TimeSyncService.setSystemTime()
  }
  props.timeSynced = true;
  console.log("||||||||||||||||| SETTING SYSTEM TIME: "+ date)
  res()
})
}

module.exports = TimeSyncTask;