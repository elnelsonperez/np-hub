const service = require("./../app/services/BluetoothService/BluetoothService")
const BtMessage = require("./../app/services/BluetoothService/BtMessage")
const Bluetooth = new service({debug: true})
Bluetooth.initialize()
Bluetooth.on("EVENT", (e) => {
  if (e.name === "NEW_CONNECTION") {
    Bluetooth.getConnectedDevices().then(a => {
      console.log(a)
      Bluetooth.sendWithResponse(
          {
            mac_address: a[0],
            message: new BtMessage({type: "test", payload: {hello: "hola"}})
          },
        ).then(z => {
        console.log(z)
      }).catch(d => {
        console.log(d)
      })
    })
  }
})


