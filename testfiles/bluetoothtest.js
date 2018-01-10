const service = require("./../app/services/BluetoothService/BluetoothService")
const Bluetooth = new service({debug: true})
Bluetooth.initialize()
