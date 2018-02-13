const RequestQueueService = require ("./../app/services/RequestQueueService")
const RequestProcessorService = require ("./../app/services/RequestProcessorService")
const SequentialSerialManager = require ( "./../lib/SequentialSerialManager")
const GprsObj = require("../app/services/GprsService").GprsService
const SerialManager =  new SequentialSerialManager.SequentialSerialManager(true);
const Service = new RequestQueueService()
const GprsManager = new GprsObj(SerialManager)

Service.addRequest({
  url: "http://nppms.us/api/hub_test",
  method: "POST",
  payload:  {"locations":[{"time":"2018-02-13 02:20:22","lat":19.445528333333332,"lng":-70.669127}],
    "hub_serial":"00000000ddc7c7fb","processed_on":1518502908379},
  priority: RequestQueueService.PRIORITY_MEDIUM,
  event_name: "hello"
})

GprsManager.initialize().then(() => {
    const processor = new RequestProcessorService(Service, GprsManager)
    processor.on("hello" , function (a) {
        console.log("Response Event Received:")
        console.log(a)
    })

    processor.processNextPendingRequest().then(() => {
      console.log("Pending request processed")
      processor.processNextPendingRequest().then( () => {
        console.log("Pending request processed")
      })
    }).catch(e => {
      console.log(e)
    })

})
