const RequestQueueService = require ("./../app/services/RequestQueueService")
const Service = new RequestQueueService()
// Service.insertRequest({
//   url: "http://test.com",
//   method: "GET",
//   type: RequestQueueService.TYPE_OUTGOING,
//   payload: JSON.stringify({data: "Hello"}),
//   priority: RequestQueueService.PRIORITY_MEDIUM
// }).then(() => {
//
// })

Service.getNextRequest().then(a => {
  console.log(a)
})

Service.getRequestById(1).then(a => {
  console.log(a)
})