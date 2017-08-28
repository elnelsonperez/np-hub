const fs = require('fs')

// Necesario
// chmod a+w /sys/devices/w1_bus_master1/w1_master_slaves
// chmod a+w /sys/devices/w1_bus_master1/w1_master_remove
// chmod a+w /sys/devices/w1_bus_master1/w1_master_search

module.exports.IbuttonReader = function ({readInterval = 2000}) {

  this.read = function () {
    return new Promise( (res,rej) => {
      let content = null;

      function readFromFile() {
        fs.readFile('/sys/devices/w1_bus_master1/w1_master_slaves').then(read => {

          if (!read.includes('not found.')) {
            content = read;
            fs.writeFile('/sys/devices/w1_bus_master1/w1_master_remove', content,'utf8',function (err) {
              if (err)
                rej('iButton Error: Cant write to delete file')
              else
                res(content);
            })
          }

        }).catch(e => {
          console.log('iButton Error: Can\'t read 1wire file '+e)
          rej('iButton Error: Can\'t read 1wire file')
        })
      }

      while (content === null) {
        setTimeout(readFromFile, readInterval)
      }

    });
  }



}
