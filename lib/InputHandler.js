const util = require('util')
const EventEmitter = require('events').EventEmitter
const gpio = require('rpi-gpio');

/**
 * This object Handles Pi Input
 */
const InputHandler = function ({delay = 200}) {

    let inputPins = []

    this.registerInputPins = function ({$pins}) {

        /**
         * $pins
         * {
         *   type: InputHandler::Type
         *   number: Integer
         * }
         */

        if (Array.isArray(pins)) {
            for (let pin of pins) {
                if (pin.type && pin.number) {
                    inputPins.push(pin)
                }
            }
        }

    }

    this.initializeRegisteredPins = async function () {
        for (let pin of inputPins) {
            try {
                await gpio.promise.setup(pin.number, gpio.DIR_IN);
            } catch (e) {
                console.log('\n------------------\nSetup for Pin ' +pin.number+' Failed\n')
            }
        }
    }

    this.monitorRegisteredPins = function () {
        setInterval(() => {
            for (let pin of inputPins) {
                gpio.promise.read(pin.number).then((s) => {
                    if (s === true) {
                        if (pin.type === InputHandler.TYPE_PUSH_BUTTON) {
                            this.emit('INPUT:'+pin.number+':PRESSED')
                        }
                    }
                }).catch(e => {
                    console.log(e)
                })
            }
        }, delay)
    }

}

InputHandler.TYPE_PUSH_BUTTON = 0

util.inherits(InputHandler, EventEmitter)

module.exports.InputHandler = InputHandler;
