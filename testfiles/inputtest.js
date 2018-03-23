const InputHandler = require('../app/core/InputManager').InputHandler;

const inputHandler = new InputHandler(150);
inputHandler.registerInputPins(
    {
        pins: [
            {
                type: InputHandler.TYPE_PUSH_BUTTON,
                number: 33,
                name : "auth"
            }
        ]
    }
)

inputHandler.initializeRegisteredPins().then(function () {
    inputHandler.monitorRegisteredPins()
})


inputHandler.on("INPUT:auth:PRESSED", function () {
    console.log("Pressed")
})

inputHandler.on("INPUT:auth:UNPRESSED", function () {
    console.log("Unpressed")
})