const RequestQueueService = require ("./../app/services/RequestQueueService")
const RequestProcessorService = require ("./../app/services/RequestProcessorService")
// const SequentialSerialManager = require ( "./../lib/SequentialSerialManager")
// const GprsObj = require("../app/services/GprsService").GprsService
// const SerialManager =  new SequentialSerialManager.SequentialSerialManager(true);
const Service = new RequestQueueService()
const merge = require('deepmerge')
// const GprsManager = new GprsObj(SerialManager)

Service.getPendingRequestsByEventName("LOCATION_POST").then(requests => {
 console.log(requests)
})

const processor = new RequestProcessorService(Service, null)
// processor.mergeLocationRequests()

// Service.addRequest({
//   url: 'http://nppms.us/api/hub_localizaciones',
//   method: RequestQueueService.METHOD_POST,
//   payload: {"locations":[{"time":"2018-04-08 16:29:55","lat":19.4459035,"lng":-70.66910166666666}]},
//   priority: RequestQueueService.PRIORITY_HIGH,
//   event_name: "LOCATION_POST"
// })


// GprsManager.initialize().then(() => {
//     const processor = new RequestProcessorService(Service, GprsManager)
//     processor.on("hello" , function (a) {
//         console.log("Response Event Received:")
//         console.log(a)
//     })
//
//     processor.processNextPendingRequest().then((a) => {
//       console.log("Pending request processed:", a)
//     }).catch(e => {
//       console.log(e)
//     })
//
// })
