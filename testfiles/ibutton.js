const service = require('./../app/services/IbuttonService')
const ibutton = new service()
const interval = require('interval-promise')

ibutton.startBlinking()
setTimeout(() => {ibutton.stopBlinking()},2000)

interval(async () => {
await ibutton.read()
}, 500)

