const util = require('util')
const EventEmitter = require('events').EventEmitter
const gpio = require('rpi-gpio');

/**
 * Este objeto monitorea botones conectados por GPIO.
 * Existe para que se pueda asociar un nombre a cada Pin de lectura
 * y poder escuchar por los eventos de PRESSED y UNPRESSED de cada pin registrado.
 *
 * Ejemplo, para un pin
 * {
 *   type: InputManager.TYPE_PUSH_BUTTON
 *   number: 12,
 *   name: 'BOTON1'
 * }
 *
 * Cada vez que se active el pin 12 se disparara el evento 'INPUT:BOTON1:PRESSED'
 * Cuando se suelte, 'INPUT:BOTON1:UNPRESSED'
 *
 * Util para saber cuando se activa un pin escuchando los eventos emitidos por el InputManager.
 */

const InputManager = function ({delay = 200}) {

    let inputPins = []

    this.registerInputPins = function ({pins}) {

        /**
         * Registra los pines del GPIO a ser monitoreados.
         * Recibe un array de pins, que deben de contener la siguiente estructura:
         * {
         *   type: InputHandler::Type
         *   number: Integer,
         *   name: String
         * }
         */

        if (Array.isArray(pins)) {
            for (let pin of pins) {
                if (pin.hasOwnProperty('type') && pin.hasOwnProperty('number')) {
                    if (!pin.hasOwnProperty('name')) {
                        pin.name = pin.number;
                    }
                    pin.status = InputService.PIN_STATUS_IDDLE;
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
        if (pin.type === InputService.TYPE_PUSH_BUTTON) {
            if (status === true && pin.status !== InputService.PIN_STATUS_PRESSED) {
                pin.status = InputService.PIN_STATUS_PRESSED;
                this.emit('INPUT:'+pin.name+':PRESSED')
            } else {
                if (status === false) {
                    if (pin.status !== InputService.PIN_STATUS_IDDLE) {
                        pin.status = InputService.PIN_STATUS_IDDLE;
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

InputManager.TYPE_PUSH_BUTTON = 0
InputManager.PIN_STATUS_PRESSED = 0;
InputManager.PIN_STATUS_IDDLE = 1;

util.inherits(InputManager, EventEmitter)

module.exports = InputManager;
