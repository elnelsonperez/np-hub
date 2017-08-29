module.exports.getSerial = function (){
    const fs = require('fs');
    const content = fs.readFileSync('/proc/cpuinfo', 'utf8');
    const cont_array = content.split("\n");
    const serial = cont_array[cont_array.length-2].split(":");
    return serial[1].slice(1);
}