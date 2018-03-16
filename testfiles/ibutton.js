const service = require('./../app/services/IbuttonService')
const ibutton = new service()
const interval = require('interval-promise')

ibutton.startBlinking()

ibutton.readOnlyValid()


