
const Message = function (type, name, payload) {
  this.name = name;
  this.type = type;
  this.body = jsonOrText(payload)
  this.has = (body_param) => {
    return !!this.body[body_param];
  }
  this.isEvent = () => {
    return this.type === "EVENT"
  }
  this.isLog = () => {
    return this.type === "LOG"
  }
  this.isException = () => {
    return this.type === "EXCEPTION"
  }
}

function jsonOrText(str = null) {
  if (!str)
    return {}
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}
module.exports = Message;
