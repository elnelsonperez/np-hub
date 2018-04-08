/*
Puerta de entrada a la aplicacion.
Desde aqui se inicia el 'engine' del Hub.
Ademas, se instancian los servicios y se le pasan al engine.
 */

const Application = require('./app/App').Application

const SequentialSerialManager = require('./lib/SequentialSerialManager')
const GprsService =  require('./app/services/GprsService')
const IbuttonService = require('./app/services/IbuttonService')
const ConfigService = require('./app/services/ConfigService')
const StatsService = require('./app/services/StatsService')
const MensajeService = require('./app/services/MensajeService')
const IncidenciaService = require('./app/services/IncidenciaService')
const RequestSenderService = require('./app/services/RequestSenderService')
const BridgeService = require('./app/services/BridgeService')
const HardwareLoaderService = require('./app/services/HardwareLoaderService')
const RequestQueueService = require("./app/services/RequestQueueService")
const RequestProcessorService = require("./app/services/RequestProcessorService")
const BluetoothService = require("./app/services/BluetoothService/BluetoothService")
const TimeSyncService = require('./app/services/TimeSyncService')

const instances = {}
instances.TimeSyncService = new TimeSyncService()
instances.SequentialSerialManager = new SequentialSerialManager()
instances.GprsService = new GprsService(instances.SequentialSerialManager)
instances.BluetoothService = new BluetoothService({debug: false})
instances.IbuttonService = new IbuttonService({});
instances.RequestQueueService = new RequestQueueService()
instances.RequestProcessorService = new RequestProcessorService (
  instances.RequestQueueService,
  instances.GprsService
)
instances.RequestSenderService = new RequestSenderService(
  instances.RequestQueueService,
  instances.RequestProcessorService,
)
instances.ConfigService = new ConfigService(
  instances.RequestSenderService,
  instances.RequestQueueService,
  "http://nppms.us/api/hub_config"
)
instances.MensajeService = new MensajeService(instances.RequestSenderService)
instances.IncidenciaService = new IncidenciaService(instances.RequestSenderService)
instances.HardwareLoaderService = new HardwareLoaderService({
  GprsService:  instances.GprsService,
  ConfigService: instances.ConfigService,
  BluetoothService: instances.BluetoothService,
})
instances.StatsService = new StatsService(instances.RequestSenderService)
instances.BridgeService = new BridgeService({
  BluetoothService: instances.BluetoothService,
  MensajeService: instances.MensajeService,
  IncidenciaService: instances.IncidenciaService,
  IbuttonService: instances.IbuttonService,
  StatsService: instances.StatsService
})

app = new Application();

app.initialize (
  {
    disabledFunctionality: {
      lcd: true
    },
    inputPins:  {
      pins: [
        // {
        //   type: InputManager.TYPE_PUSH_BUTTON,
        //   number: 33,
        //   name: 'showAuth'
        // }
      ]
    },
    services: instances
  }
);




