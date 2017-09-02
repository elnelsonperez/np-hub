const fs = require('fs')

// Necesario
// chmod a+w /sys/devices/w1_bus_master1/w1_master_slaves
// chmod a+w /sys/devices/w1_bus_master1/w1_master_remove
// chmod a+w /sys/devices/w1_bus_master1/w1_master_search

module.exports.IbuttonReader = function ({readInterval = 1000}) {

  this.read = function () {
    return new Promise( (res,rej) => {
      let content = null;
      let timerid = null;
      function readFromFile() {
        fs.readFile('/sys/devices/w1_bus_master1/w1_master_slaves', {encoding: 'utf8'}, function (err, content) {
            if (err) {
                console.log('iButton Error: Can\'t read 1wire file '+e)
                rej('iButton Error: Can\'t read 1wire file')
            }

            if (!content.includes('not found.')) { //Found ID
                content = content.replace(/\r?\n|\r/g, "")
                console.log('IButton read: '+ content+'\n' )
                fs.writeFile('/sys/devices/w1_bus_master1/w1_master_remove', content,'utf8', function (err) {
                    if (err)
                        rej('iButton Error: Cant write to delete file')
                    else
                        res(content);
                })

                if (timerid)
                    clearTimeout(timerid)

            } else {
                timerid = setTimeout(readFromFile, readInterval)
            }
        });
      }

      if (content === null) {
          readFromFile();
      }
    });
  }



}
