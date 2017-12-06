const util = require('util')
const EventEmitter = require('events').EventEmitter
const gpio = require('rpi-gpio');

/**
 * This object Handles Pi Input
 */
const InputHandler = function ({delay = 200}) {

    let inputPins = []

    this.registerInputPins = function ({pins}) {

        /**
         * $pins
         * {
         *   type: InputHandler::Type
         *   number: Integer
         * }
         */


        if (Array.isArray(pins)) {
            for (let pin of pins) {
                if (pin.hasOwnProperty('type') && pin.hasOwnProperty('number')) {
                    if (!pin.hasOwnProperty('name')) {
                        pin.name = pin.number;
                    }
                    pin.status = InputHandler.PIN_STATUS_IDDLE;
                    inputPins.push(pin)
                }
            }
        }

    }

    this.initializeRegisteredPins = async function () {
        for (let pin of inputPins) {
            try {
                await gpio.promise.setup(pin.number, gpio.DIR_IN);
                console.log('Pin Initialized: '+pin.number)
            } catch (e) {
                console.log('\n------------------\nSetup for Pin ' +pin.number+' Failed\n')
            }
        }
        return true;
    }

    this.handlePinStatus = function (pin, status) {
        if (pin.type === InputHandler.TYPE_PUSH_BUTTON) {
            if (status === true && pin.status !== InputHandler.PIN_STATUS_PRESSED) {
                pin.status = InputHandler.PIN_STATUS_PRESSED;
                this.emit('INPUT:'+pin.name+':PRESSED')
            } else {
                if (status === false) {
                    if (pin.status !== InputHandler.PIN_STATUS_IDDLE) {
                        pin.status = InputHandler.PIN_STATUS_IDDLE;
                        this.emit('INPUT:'+pin.name+':UNPRESSED')
                    }
                }
            }
        }
    }

    this.startPinHoldTimer = function (pin, s) {



        if (s === false && pin.hasOwnProperty('holdTimer') && pin.holdTimer !== null) {
            pin.holdTimer = null;
            clearTimeout(pin.holdTimer)
        }

        if (s === true  && (!pin.hasOwnProperty('holdTimer') || pin.holdTimer === null)) {

            pin.holdTimer  = setTimeout(() => {
                pin.holdTimer = null;
                gpio.promise.read(pin.number).then(s => {
                    this.handlePinStatus(pin, s)
                }).catch(e => console.log(e))
            }, pin.hold)
        }
    }

    this.monitorRegisteredPins = function () {
        setInterval(() => {
            for (let pin of inputPins) {
                gpio.promise.read(pin.number).then((s) => {
                    if (pin.hold) { //The pin needs to be active some 'hold' time
                        this.startPinHoldTimer(pin,s)
                    } else {
                        this.handlePinStatus(pin,s)
                    }
                }).catch(e => {
                    console.log(e)
                })
            }
        }, delay)
    }

}

InputHandler.TYPE_PUSH_BUTTON = 0
InputHandler.PIN_STATUS_PRESSED = 0;
InputHandler.PIN_STATUS_IDDLE = 1;


util.inherits(InputHandler, EventEmitter)

module.exports.InputHandler = InputHandler;
