const service = require("./../app/services/BluetoothService/BluetoothService")
const BtMessage = require("./../app/services/BluetoothService/BtMessage")
const Bluetooth = new service({debug: true})
Bluetooth.initialize({allowedMacAddresses: ["80:65:6D:90:43:F7"]})
Bluetooth.on("EVENT", (e) => {
  if (e.name === "NEW_CONNECTION") {
    Bluetooth.getConnectedDevices().then(a => {
      Bluetooth.sendToDevice(
          {
            mac_address: "80:65:6D:90:43:F7",
            message: new BtMessage(
                {
                  type: "GET_DEVICE_CONFIG_RESPONSE",
                  payload: {
                    oficial:
                        { id: 2,
                          nombre: 'Nelson Prueba',
                          apellido: 'Policia Unidad',
                          ibutton: { id: 1, oficial_id: 2, code: '00000174DD83' } },
                    destacamento: {
                      nombre:"Prof. Onie Kulas Sr.",
                      id:1,
                      ubicacion:{"type":"Point","coordinates":[-70.66622,19.449027]}},
                    sector: {limites:{
                        type:"Polygon",
                        coordinates:[[[-70.686254091561,19.460945137833],[-70.687219686806,19.468268873049],[-70.696897096932,19.462968302182],[-70.696283373982,19.461816366076],[-70.696272645146,19.461664628547],[-70.696379933506,19.461553354269],[-70.6981931068,19.460885706999],[-70.69821992889,19.457582835747],[-70.6959615089,19.45824543859],[-70.694330725819,19.458832168618],[-70.692388806492,19.459661679863],[-70.690908227116,19.460278752549],[-70.690007004887,19.460632809588],[-70.689298901707,19.460835127548],[-70.688590798527,19.460926170548],[-70.687689576298,19.460926170548],[-70.686896732119,19.460895192056],[-70.686537860963,19.460869585788],[-70.686374518623,19.460871956257],[-70.68627407197,19.460878199391],[-70.686254091561,19.460945137833]]]},
                      id:89,
                      nombre:"Los Jardines Metropolitanos"}}

                }
            )
          }
      )
      Bluetooth.sendToDevice(
          {
            mac_address: "80:65:6D:90:43:F7",
            message: new BtMessage(
                {
                  type: "NEW_SERVER_MESSAGES",
                  payload: [{"id":11,"creado_en":"2018-02-25 19:06:15","sentido":1,"contenido":"Gols","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":12,"creado_en":"2018-02-25 19:08:10","sentido":1,"contenido":"Holaaaa","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":13,"creado_en":"2018-02-25 19:08:22","sentido":0,"contenido":"gracias","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":14,"creado_en":"2018-02-25 19:31:34","sentido":1,"contenido":"Yellow","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":15,"creado_en":"2018-02-25 19:31:51","sentido":1,"contenido":"Tatola","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":16,"creado_en":"2018-02-25 19:32:13","sentido":1,"contenido":"Dale","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":17,"creado_en":"2018-02-25 19:32:23","sentido":1,"contenido":"Rompe to","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":18,"creado_en":"2018-02-25 19:32:32","sentido":1,"contenido":"Hh","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":19,"creado_en":"2018-02-25 19:53:10","sentido":1,"contenido":"Dale","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":20,"creado_en":"2018-02-25 20:25:25","sentido":1,"contenido":"Haha","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":21,"creado_en":"2018-02-25 20:25:30","sentido":1,"contenido":"Haharompe","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":22,"creado_en":"2018-02-25 20:25:43","sentido":1,"contenido":"Haharompehfhhwhwhw","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":23,"creado_en":"2018-02-25 20:25:56","sentido":1,"contenido":"Haharompehfhhwhwhwfaleeee","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":24,"creado_en":"2018-02-25 20:26:05","sentido":1,"contenido":"Loool","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":25,"creado_en":"2018-02-25 20:26:14","sentido":1,"contenido":"Loooltompelp to","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":26,"creado_en":"2018-02-25 20:26:23","sentido":1,"contenido":"tomsksmdmf","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":27,"creado_en":"2018-02-25 20:26:26","sentido":1,"contenido":"tomsksmdmfmrmflr","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":28,"creado_en":"2018-02-25 20:26:29","sentido":1,"contenido":"2q111","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":29,"creado_en":"2018-02-25 20:26:34","sentido":1,"contenido":"2q111llrlrl","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":30,"creado_en":"2018-02-25 20:26:38","sentido":1,"contenido":"2q111llrlrllelellele","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":31,"creado_en":"2018-02-25 20:26:46","sentido":1,"contenido":"2q111llrlrllelellelelekk","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":32,"creado_en":"2018-02-25 20:28:23","sentido":1,"contenido":"Rompe ro","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":33,"creado_en":"2018-02-25 20:28:32","sentido":1,"contenido":"Yaaa","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":34,"creado_en":"2018-02-25 20:28:41","sentido":1,"contenido":"Dalwe","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":35,"creado_en":"2018-02-25 20:28:57","sentido":1,"contenido":"Jajajaja","oficial_unidad_id":2,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Nelson Prueba","apellido":"Policia Unidad","id":2}},{"id":1,"creado_en":"2018-02-25 19:04:06","sentido":0,"contenido":"Pariatur quisquam odit quas autem et.","oficial_unidad_id":4,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Kobe","apellido":"Block","id":4}},{"id":2,"creado_en":"2018-02-25 19:04:06","sentido":1,"contenido":"Aspernatur vitae labore doloremque et. Voluptatem non nobis ut est. Qui iusto earum eius quo quo. Est rerum hic et doloribus quas consequatur iure corporis. Vel ipsam vitae magnam aut amet.","oficial_unidad_id":4,"remitente":{"id":1,"nombre":"Nelson","apellido":"Perez Lora"},"oficial_unidad":{"nombre":"Kobe","apellido":"Block","id":4}}]
                }
            )
          }
      )
    })
  }
})


