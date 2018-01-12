// const autoincrement = require('autoincrement').from(1);
const autoincrement = require('autoincrement');
const BtMessage = function ({corr_id = null, type, payload}) {
  this.type = type;
  if (!corr_id)
    this.corr_id = +autoincrement
  else
    this.corr_id = corr_id
  this.payload = jsonOrText(payload)
  this.has = (body_param) => {
    return !!this.body[body_param];
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

module.exports = BtMessage;
