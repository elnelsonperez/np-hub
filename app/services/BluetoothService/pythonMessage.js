
    const Message =function (type, name, payload) {
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
    const res = JSON.parse(str);
    return res;
  } catch (e) {
    return str;
  }
}
    module.exports = Message;
