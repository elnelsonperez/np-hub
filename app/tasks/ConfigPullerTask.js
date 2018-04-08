const Task  = require('../core/Task').Task
const props = require('./../shared/props')

const ConfigPullerTask = new Task (
    {
      name: 'ConfigPullerTask',
      every: 20000,
      inject: ["ConfigService"],
      autoload: false,
      ready: false
    }
);

ConfigPullerTask.initialize = function () {
  props.applicationEvent.on("config.ready", () => {
    this.ready = true;
  })
}

ConfigPullerTask.run = async function () {
  let config = await this.ConfigService.getDeviceConfiguration();
  if (config) {
    props.applicationEvent.emit("config.update", config)
  }
}

module.exports = ConfigPullerTask;