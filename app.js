const Application = require('./app/App').Application;
const props = require('./app/shared/props')
const BtMessage = require('./app/services/BluetoothService/BtMessage')
app = new Application();
app.disabledFunctionality.lcd = true;
const argv = require('minimist')(process.argv.slice(2));


  app.initialize({
    verbose: !!argv.verbose,
    bridgeDebug: !!argv.bridgeDebug,
    noLocations: !!argv.noLocations,
    noAuth: !!argv.noAuth,
  });

  process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  });

  props.applicationEvent.on('boot.ready', function () {
    setTimeout(() => {
      // app.switchModuleDomain('default')
      console.log(" ==== BOOT READY ====\n")
    }, 1500)
  })

  process.on('SIGINT', function() {
    console.log('======================\nReceived shut down signal\n========================\n')
    process.exit();
  });

