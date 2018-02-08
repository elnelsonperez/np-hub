const RequestQueueService = require ("./../app/services/RequestQueueService")
const RequestProcessorService = require ("./../app/services/RequestProcessorService")
const SequentialSerialManager = require ( "./../lib/SequentialSerialManager")
const GprsObj = require("../app/services/GprsService").GprsService
const SerialManager =  new SequentialSerialManager.SequentialSerialManager(true);
const Service = new RequestQueueService()
const GprsManager = new GprsObj(SerialManager)

// Service.addRequest({
//   url: "http://httpbin.org/post",
//   method: "POST",
//   payload: JSON.stringify({data: "Hello"}),
//   priority: RequestQueueService.PRIORITY_MEDIUM,
//   event_name: "hello"
// })
Service.addRequest({
  url: "http://httpbin.org/post",
  method: "POST",
  payload: JSON.stringify({
    "userId": 1,
    "id": 1,
    "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
    "body": "quia et suscipit suscipit recusandae consequuntur expedita et cum reprehenderit molestiae ut ut quas totam nostrum rerum est autem sunt rem eveniet architecto"
  }),
  priority: RequestQueueService.PRIORITY_MEDIUM,
  event_name: "hello"
})
Service.addRequest({
  url: "http://httpbin.org/post",
  method: "POST",
  payload: JSON.stringify({data: "Hello"}),
  priority: RequestQueueService.PRIORITY_MEDIUM,
  event_name: "hello"
})
Service.getAllRequests().then(s => {
    console.log("PendingRequests")
    console.log(s)
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
