const pythonMessage = require("./pythonMessage")

/**
 * Represents the message that is passed between Nodejs and Python
 * @constructor
 * @return {pythonMessage}
 */
const Parser = function () {
  this.parse = (input) => {
    if (!input.includes("|") || input.startsWith("~ ")) {
      return null
    }
    const msg = input.split("|")
    const type = msg[0]
    const name = msg[1]
    const payload = msg[2];
    return new pythonMessage(type, name, payload)
  }
}


module.exports = Parser