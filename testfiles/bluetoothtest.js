const service = require("./../app/services/BluetoothService/BluetoothService")
const Bluetooth = new service({debug: true})
Bluetooth.initialize()
Bluetooth.on("EVENT", (e) => {
  if (e.name === "NEW_CONNECTION") {
    Bluetooth.getConnectedDevices().then(a => {
      console.log(a)
    })
  }
})


