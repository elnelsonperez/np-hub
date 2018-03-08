const Task  = require('../core/Task').Task
const props = require('./../App').props

const IbuttonReaderTask = new Task (
    {
      name: 'IbuttonReaderTask',
      every: 1000,
      inject: ['IbuttonService'],
      autoload: false,
      ready: false
    }
);

IbuttonReaderTask.initialize = function () {
  props.applicationEvent.on("config.ready", () => {
    this.ready = true;
  })
}

IbuttonReaderTask.run = async function () {
  try {
    const code = await this.IbuttonService.read()
    if (code !== null) {
      props.applicationEvent.emit('ibutton.read', code)
    }
  } catch (e) {
    console.log(e)
  }

}

module.exports = IbuttonReaderTask;