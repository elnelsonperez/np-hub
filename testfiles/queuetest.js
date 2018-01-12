const RequestQueueService = require ("./../app/services/RequestQueueService")
const RequestProcessorService = require ("./../app/services/RequestProcessorService")
const SequentialSerialManager = require ( "./../lib/SequentialSerialManager")
const GprsObj = require("../app/services/GprsService").GprsService
const SerialManager =  new SequentialSerialManager.SequentialSerialManager(true);
const Service = new RequestQueueService()
const GprsManager = new GprsObj(SerialManager)

// Service.addRequest({
//   url: "http://test.com",
//   method: "GET",
//   payload: JSON.stringify({data: "Hello"}),
//   priority: RequestQueueService.PRIORITY_MEDIUM,
//   event_name: "hello"
// }).then((a) => {
//
// })

Service.getAllRequests().then(s => {
    console.log("PendingRequests")
    console.log(s)
})

GprsManager.initialize().then(() => {
    const processor = new RequestProcessorService(Service, GprsManager)
    processor.on("hello" , function (a) {
        console.log("Response")
        console.log(a)
    })

    processor.processNextPendingRequest().then(() => {
      console.log("Processed")
    }).catch(e => {
      console.log(e)
    })

})
