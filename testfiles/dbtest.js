const RequestQueueService = require ("./../app/services/RequestQueueService")
const Service = new RequestQueueService()
Service.insertRequest({
  url: "http://test.com",
  method: "GET",
  payload: JSON.stringify({data: "Hello"}),
  priority: RequestQueueService.PRIORITY_MEDIUM,
  event_name: "hello"
}).then((a) => {
console.log(a)
  Service.getAllRequests().then(s=> {
    console.log(s)
  })
})


