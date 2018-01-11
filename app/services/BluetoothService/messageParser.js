const Message = require("./pythonMessage")

module.exports = function () {
  this.parse = (input) => {
    if (!input.includes("|") || input.startsWith("~ ")) {
      return null
    }
    const msg = input.split("|")
    const type = msg[0]
    const name = msg[1]
    const payload = msg[2];
    return new Message(type, name, payload)
  }
}