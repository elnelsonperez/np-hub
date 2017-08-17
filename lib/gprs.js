const util = require('util')
const events = require('events')

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

GprsManager = function (serialManager) {
    const ctx = this;
    this.mandatoryCommand = async function (promise, args, delay, message) {
        return new Promise (res => {
            function doIt() {
                promise(args).then(res).catch(e => {
                    if (message) {
                        ctx.emit('message', message)
                        console.log(message);
                    }
                    setTimeout(doIt, delay)
                });
            }
            doIt();
        })
    };

    this.initialize = async () => {

        await this.mandatoryCommand(
            serialManager.send,
            {cmd: 'AT', expect: 'OK'},
            3000,
            'Comunicacion al modulo GPRS no fue posible. Reintentando en 3segs...');

        await this.mandatoryCommand(
            serialManager.send,
            {cmd: 'AT+CREG?', expect: '+CREG: 0,1'},
            3000,
            'No registrado en red. Reintentando en 3 segs...');

        const networkAttach = await serialManager.send({cmd: 'AT+CGATT?'});
        if (networkAttach.responseContains('+CGATT: 0')) {
            await this.mandatoryCommand(
                serialManager.send,
                {cmd: 'AT+CGATT=1'},
                3000,
                'No se pudo iniciar servicio GPRS. Reintentando en 3 segs...');

        }

        const multiip = await serialManager.send({cmd: 'AT+CIPMUX=?'});
        if (!multiip.responseContains('+CIPMUX: (0,1)')) {
            await this.mandatoryCommand(
                serialManager.send,
                {cmd: 'AT+CIPMUX=0'},
                3000,
                'No se pudo iniciar coneccion multi-ip. Reintentando en 3 segs...');
        }

        await this.obtainIpAdress();

    };


    this.obtainIpAdress = async () => {
        return new Promise(res => {
            check = async () => {
                let ip = await this.checkIp();
                if (!ip) {
                    const apn = await serialManager.send({cmd: 'AT+CIPSTATUS', afterok: 1});
                    if (!apn.responseContains('STATE: IP GPRSACT')) {
                            try {
                                ciicr = await serialManager.send({cmd: 'AT+CIICR',timeout: 12000,
                                    expect: ["+CME ERROR: operation not allowed", "OK"]});
                            }  catch (e) {}
                            try {
                                await serialManager.send({cmd: 'AT+SAPBR=3,1'});
                            }  catch (e) {}
                            try {
                                await serialManager.send({cmd: 'AT+SAPBR=3,1,"Contype","GPRS"'});
                            }  catch (e) {}


                        await this.mandatoryCommand(
                            serialManager.send,
                            {cmd: 'AT+SAPBR=1,1', expect: ['OK']},
                            6000,
                            'No se pudo configurar SAPBR. Reintentando en 3 segs...');

                        await this.mandatoryCommand(
                            serialManager.send,
                            {cmd: 'AT+CSTT="internet.ideasclaro.com.do"', expect: ['+CME ERROR: operation not allowed', 'OK']},
                            3000,
                            'No se pudo configurar el APN. Reintentando en 3 segs...');
                        await check();
                    }
                } else {
                    res(ip);
                }
            }
           check();
        });
    }

    this.checkIp = async ()  =>{
        const ip = await serialManager.send({cmd: 'AT+SAPBR=2,1'});
        myRegexp = /"((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))"/g;
        match = myRegexp.exec(ip.res[0]);
        return match[0] !== '"0.0.0.0"'
    }

    this.httpGet = async (url, params) => {
        ip = await this.checkIp();
        if (ip) {

            try {
                if (params) {
                    url = url + "?params="+encodeURIComponent(JSON.stringify(params));
                }

                try {
                    await serialManager.send({cmd: 'AT+HTTPINIT'});
                    await serialManager.send({cmd: 'AT+HTTPPARA="CID",1'});
                }  catch (e) {

                }
                await serialManager.send({cmd: 'AT+HTTPPARA="URL","'+url+'"'});
                responsecode =  await serialManager.send({cmd: 'AT+HTTPACTION=0', afterok: 1, timeout: 20000});
                myRegexp = /,(\d.*),/g;
                match = myRegexp.exec(responsecode.res[1]);
                responsecode  = match[1];

                if (responsecode.startsWith('6')){
                    try { await serialManager.send({cmd: 'AT+HTTPTERM'});}catch (e) {}
                    return {code: responsecode, content: 'ERROR'}
                }

                result = await serialManager.send({cmd: 'AT+HTTPREAD'});
                if (result.res[1])
                    resultJson = IsJsonString(result.res[1])

                if (result.res[1] && resultJson) {
                    console.log()
                    content = resultJson;
                } else {
                    content = result;
                }

                try { await serialManager.send({cmd: 'AT+HTTPTERM'});}catch (e) {}

                return {code: responsecode, content: content}
            } catch (e) {
                try { await serialManager.send({cmd: 'AT+HTTPTERM'});}catch (e) {}
                return {code: 600, content: e}
            }


        } else {
            try { await serialManager.send({cmd: 'AT+HTTPTERM'});}catch (e) {}

            return {code: 601, content: 'No hay IP'}
        }

    }

};

util.inherits(GprsManager,events.EventEmitter)
module.exports.GprsManager = GprsManager;
