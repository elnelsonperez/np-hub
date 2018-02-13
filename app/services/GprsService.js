const util = require('util')
const events = require('events')

function ErrorCounter (maximun) {
  let scopedErrorCounter = 0;
  let globalErrorCounter = maximun;
  this.updateCounter = () => {
    scopedErrorCounter++;
    if (scopedErrorCounter === globalErrorCounter) {
      globalErrorCounter = 0;
      scopedErrorCounter = 0;
      return false;
    }
    return true;
  }
  this.resetCounter = () => {
    scopedErrorCounter = 0;
  }
}

Object.prototype.responseContains = function (val) {
  return this.res.find(v => {
    return v === val;
  });
};

function IsJsonString(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return false;
  }
}

events.EventEmitter.call(this);

GprsService = function (SequentialSerialManager) {

  this.initialized = false;

  /**
   * Ejecuta una promesa hasta que se resuelva
   *
   */
  this.mandatoryCommand = async function (promise, args, delay, fn = null) {
    return new Promise (res => {
      function doIt() {
        promise(args).then(res).catch(e => {
          if (fn) {
            respuesta = fn();
            if(Promise.resolve(respuesta) === respuesta){
              respuesta.then(() => {setTimeout(doIt, delay)});
            }
          }
          setTimeout(doIt, delay)

        });
      }
      doIt();
    })
  };


  this.initialize = async () => {

    SequentialSerialManager.on('specialMessage', msg => {
      if (msg.includes( "+SAPBR 1: DEACT")) {
        SequentialSerialManager.send({cmd: 'AT+HTTPTERM', alwaysresolve: true});
      }
      else if (msg.includes("PDP: DEACT")) {
        SequentialSerialManager.send({cmd: 'AT+CIPSHUT', alwaysresolve: true, expect: "SHUT OK"});
        this.obtainIpAdress()
      }
    })

    await this.mandatoryCommand(
        SequentialSerialManager.send,
        {cmd: 'AT'},
        3000,
        () => {
          console.log("Sin conexion con modulo GPRS")
          this.emit('message', 'GPRS: Intentando')
        }
    );

    try {
      await SequentialSerialManager.send({cmd: 'AT+CREG?', expect: '+CREG: 0,1'});
    } catch (e) {
      await this.mandatoryCommand(
          SequentialSerialManager.send,
          {cmd: 'AT+CREG?', expect: '+CREG: 0,1'},
          3000,
          () => {
            console.log('No se pudo registrar en red. Reintentando en 3 segs...')
            this.emit('message', 'Red: Intentando...')
          });
    }

    try {
      await SequentialSerialManager.send({cmd: 'AT+CGATT?', expect: '+CGATT: 1'})
    } catch (e) {
      await this.mandatoryCommand(
          SequentialSerialManager.send,
          {cmd: 'AT+CGATT=1'},
          3000,
          () => {
            console.log('No se pudo iniciar servicio GPRS. Reintentando en 3 segs...')
          }
      );
    }

    try {
      await SequentialSerialManager.send({cmd: 'AT+CIPMUX=?', expect: '+CIPMUX: (0,1)'})
    } catch (e) {
      await this.mandatoryCommand(
          SequentialSerialManager.send,
          {cmd: 'AT+CIPMUX=0'},
          3000,
          () => {
            console.log('No se pudo iniciar coneccion multi-ip. Reintentando en 3 segs...')
            this.emit('message', 'SingleIP: Intentando...')
          });
    }

    let ipObtained = await this.obtainIpAdress();
    if (!ipObtained) {
      this.emit('message', 'Internet: Inactivo')
    } else {
      this.emit('message', 'Internet Verify')
      const hasInternet = await this.hasInternet()
      if (!hasInternet) {
        this.emit('message', 'Internet: Inactivo')
      } else {
        this.initialized = true;
        return true;
      }
    }
    return false;

  };



  this.executeSapbr = async () => {
    return await this.mandatoryCommand(
        SequentialSerialManager.send,
        {cmd: 'AT+SAPBR=1,1', expect: ['OK', 'ERROR']},
        6000,
        () => {
          this.emit('message', 'SAPBR: Intentando...')
          console.log('No se pudo configurar SAPBR. Reintentando en 3 segs...')
        });
  }

  this.obtainIpAdress = () => {
    return new Promise(res => {
      let errorConter = new ErrorCounter(2)
      check = async () => {
        let ipTrueOrFalse = await this.checkIp();

        const ipstatus = await SequentialSerialManager.send({
          cmd: 'AT+CIPSTATUS',
          afterdelimiter: 1,
          alwaysresolve: true});
        if (ipstatus.responseContains("STATE: PDP DEACT")) {
          SequentialSerialManager.send({cmd: 'AT+CIPSHUT', alwaysresolve: true, expect: "SHUT OK"});
          await check();
        } else {
          if (!ipstatus.responseContains('STATE: IP GPRSACT') || !ipTrueOrFalse) {
            if (ipstatus.responseContains('STATE: IP START')) {
              try {
                await SequentialSerialManager.send({cmd: 'AT+CIICR',timeout: 12000, expect: ["OK"]});
              } catch (e) {
                console.log(e)
              }
              await check()
            }
            else {
              await SequentialSerialManager.send({cmd: 'AT+SAPBR=3,1,"Contype","GPRS"',alwaysresolve: true});

              const sapbr = await this.executeSapbr();
              if (sapbr.responseContains("ERROR")) {
                await  SequentialSerialManager.send({cmd: 'AT+SAPBR=0,1', expect: ['OK','ERROR'], alwaysresolve: true})
                await this.executeSapbr()
              }

              await this.mandatoryCommand(
                  SequentialSerialManager.send,
                  {cmd: 'AT+CSTT="internet.ideasclaro.com.do"', expect: ['OK']},
                  3000,
                  () => {
                    console.log('No se pudo configurar el APN. Reintentando en 3 segs...',)
                    this.emit('message', 'APN: Intentando...')
                  });

              await check();
            }
          }
          else {
            if (ipTrueOrFalse) {
              res(true);
            } else {
              setTimeout(async  () => {
                let tryAgain = errorConter.updateCounter();
                if (!tryAgain) {
                  res(false)
                }
                console.log('\n No se ha podido obtener una IP. Intentando en 3 Segs...\n')
                this.emit('message', 'IP: Intentando...')
                await check();
              },3000)
            }
          }
        }

      }
      check();
    });
  }

  this.checkIp = async ()  =>{
    const ip = await SequentialSerialManager.send({cmd: 'AT+SAPBR=2,1'});
    myRegexp = /"((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))"/g;
    if (ip.res[0]) {
      match = myRegexp.exec(ip.res[0]);
      if (match && match[0]) {
        return match[0] !== '"0.0.0.0"'
      }
    }
    return false;
  }

  this.httpGet = async (url, params, time = 20000) => {

    try {
      if (params) {
        url = url + "?params="+encodeURIComponent(JSON.stringify(params));
      }

      try {
        await SequentialSerialManager.send({cmd: 'AT+HTTPINIT'});
      }  catch (e) {
        //This should be managed by a mandatory command
        if (e.res.includes('ERROR')){
          await SequentialSerialManager.send({cmd: 'AT+HTTPTERM', alwaysresolve: true});
          await SequentialSerialManager.send({cmd: 'AT+HTTPINIT', alwaysresolve: true});
        }
      }

      await SequentialSerialManager.send({cmd: 'AT+HTTPPARA="CID",1', alwaysresolve: true});

      await SequentialSerialManager.send({cmd: 'AT+HTTPPARA="URL","'+url+'"', alwaysresolve: true});

      responsecode =  await SequentialSerialManager.send({cmd: 'AT+HTTPACTION=0', afterdelimiter: 1, timeout: time});
      myRegexp = /,(\d.*),/g;
      match = myRegexp.exec(responsecode.res[1]);
      responsecode  = match[1];

      if (responsecode.startsWith('6')){
        await SequentialSerialManager.send({cmd: 'AT+HTTPTERM', expect: ['ERROR','OK']})
        return {code: responsecode, content: 'Network Error: Impossible'}
      }

      result = await SequentialSerialManager.send({cmd: 'AT+HTTPREAD'});
      if (result.res[1]) {
        resultJson = IsJsonString(result.res[1])
        if (resultJson) {
          content = resultJson;
        } else {
          content = result.res[1];
        }
      } else {
        content = result.res;
      }
      await SequentialSerialManager.send({cmd: 'AT+HTTPTERM', expect: ['ERROR','OK']})
      return {code: responsecode, content: content}

    } catch (e) {
      try { await SequentialSerialManager.send({cmd: 'AT+HTTPTERM'});}catch (e) {}
      return {code: 600, content: e}
    }



  }

  this.httpPost = async (url, params,time = 20000) => {

    try {
      try {
        await SequentialSerialManager.send({cmd: 'AT+HTTPINIT'});
      }  catch (e) {
        //This should be managed by a mandatory command
        if (e.res.includes('ERROR')){
          await SequentialSerialManager.send({cmd: 'AT+HTTPTERM', alwaysresolve: true});
          await SequentialSerialManager.send({cmd: 'AT+HTTPINIT', alwaysresolve: true});
        }
      }

      await SequentialSerialManager.send({cmd: 'AT+HTTPPARA="CID",1', alwaysresolve: true});

      await SequentialSerialManager.send({cmd: 'AT+HTTPPARA="URL","'+url+'"', alwaysresolve: true});

      if (params) {
        params = JSON.stringify(params);
        await SequentialSerialManager.send({cmd: 'AT+HTTPPARA="CONTENT","application/json"'})

        await SequentialSerialManager.send(
            {
              cmd: 'AT+HTTPDATA='+params.length+','+'5000',
              delimiter: 'DOWNLOAD',
              expect: "DOWNLOAD",
              timeout: 10000
            }
        )
        console.log("POST PARAMS: "+params)
        await SequentialSerialManager.send({cmd: params})
      }

      responsecode =  await SequentialSerialManager.send({cmd: 'AT+HTTPACTION=1', afterdelimiter: 1, timeout: time});
      myRegexp = /,(\d.*),/g;
      match = myRegexp.exec(responsecode.res[1]);
      responsecode  = match[1];

      if (responsecode.startsWith('6')){
        await SequentialSerialManager.send({cmd: 'AT+HTTPTERM', expect: ['ERROR','OK']})
        return {code: responsecode, content: 'Network Error: Impossible'}
      }

      result = await SequentialSerialManager.send({cmd: 'AT+HTTPREAD'});
      if (result.res[1]) {
        resultJson = IsJsonString(result.res[1])
        if (resultJson) {
          content = resultJson;
        } else {
          content = result.res[1];
        }
      } else {
        content = result.res;
      }
      await SequentialSerialManager.send({cmd: 'AT+HTTPTERM', expect: ['ERROR','OK']})
      return {code: responsecode, content: content}

    } catch (e) {
      try { await SequentialSerialManager.send({cmd: 'AT+HTTPTERM'});}catch (e) {}
      return {code: 600, content: e}
    }

  }

  this.hasInternet = async () => {
    try {
      result =  await this.httpGet('http://nppms.us/api/status');
      if (result.code === '200' && result.content === 'ACTIVO') {
        return true;
      }
    } catch (e) {console.log(e)}
    return false;
  }

  this.getSignalStrength = async () => {
    res = await SequentialSerialManager.send({cmd: 'AT+CSQ'})
    regex = /CSQ: (.*),(.*)$/g;
    match =  regex.exec(res.res[0])
    if (match) {
      return {rssi: match[1], ber: match[2]};
    } else {
      return null;
    }

  }

};

util.inherits(GprsService,events.EventEmitter)
module.exports.GprsService = GprsService;
