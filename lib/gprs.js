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

GprsManager = function (SequentialSerialManager) {
    this.mandatoryCommand = async function (promise, args, delay, message, fn = null) {
        return new Promise (res => {
            function doIt() {
                promise(args).then(res).catch(e => {
                    if (message) {
                        console.log(message);
                        if (fn)
                        fn();
                    }
                    setTimeout(doIt, delay)
                });
            }
            doIt();
        })
    };

    this.initialize = async () => {

        await this.mandatoryCommand(
            SequentialSerialManager.send,
            {cmd: 'AT', expect: 'OK'},
            3000,
            'Comunicacion al modulo GPRS no fue posible. Reintentando en 3segs...',
            () => {this.emit('failed', 'Serial: Intentando...')});


        await this.mandatoryCommand(
            SequentialSerialManager.send,
            {cmd: 'AT+CREG?', expect: '+CREG: 0,1'},
            3000,
            'No registrado en red. Reintentando en 3 segs...',
            () => {this.emit('failed', 'Red: Intentando...')});

        const networkAttach = await SequentialSerialManager.send({cmd: 'AT+CGATT?'});
        if (networkAttach.responseContains('+CGATT: 0')) {
            await this.mandatoryCommand(
                SequentialSerialManager.send,
                {cmd: 'AT+CGATT=1'},
                3000,
                'No se pudo iniciar servicio GPRS. Reintentando en 3 segs...',
                () => {this.emit('failed', 'GPRS: Intentando...')});

            // this.emit('failed', 'GPRS: Intentando...')

        }

        const multiip = await SequentialSerialManager.send({cmd: 'AT+CIPMUX=?'});
        if (!multiip.responseContains('+CIPMUX: (0,1)')) {
            await this.mandatoryCommand(
                SequentialSerialManager.send,
                {cmd: 'AT+CIPMUX=0'},
                3000,
                'No se pudo iniciar coneccion multi-ip. Reintentando en 3 segs...',
                () => {this.emit('failed', 'MultiIP: Intentando...')});
        }


        await this.obtainIpAdress();

    };

    this.obtainIpAdress = async () => {
        return new Promise(res => {
            check = async () => {
                let ipTrueOrFalse = await this.checkIp();
                if (!ipTrueOrFalse) {
                    const apn = await SequentialSerialManager.send({cmd: 'AT+CIPSTATUS', afterok: 1});
                    if (!apn.responseContains('STATE: IP GPRSACT')) {
                            try {
                                ciicr = await SequentialSerialManager.send({cmd: 'AT+CIICR',timeout: 12000,
                                    expect: ["+CME ERROR: operation not allowed", "OK"]});
                            }  catch (e) {}
                            try {
                                await SequentialSerialManager.send({cmd: 'AT+SAPBR=3,1'});
                            }  catch (e) {}
                            try {
                                await SequentialSerialManager.send({cmd: 'AT+SAPBR=3,1,"Contype","GPRS"'});
                            }  catch (e) {}


                        await this.mandatoryCommand(
                            SequentialSerialManager.send,
                            {cmd: 'AT+SAPBR=1,1', expect: ['OK']},
                            6000,
                            'No se pudo configurar SAPBR. Reintentando en 3 segs...',
                            () => {this.emit('failed', 'SAPBR: Intentando...')});


                        await this.mandatoryCommand(
                            SequentialSerialManager.send,
                            {cmd: 'AT+CSTT="internet.ideasclaro.com.do"', expect: ['+CME ERROR: operation not allowed', 'OK']},
                            3000,
                            'No se pudo configurar el APN. Reintentando en 3 segs...',
                            () => {this.emit('failed', 'APN: Intentando...')});

                        await check();
                    } else {
                        setTimeout(async  () => {
                            console.log('\n No se ha podido obtener una IP. Intentando en 3 Segs...\n')
                            this.emit('failed', 'IP: Intentando...')
                            await check();
                        },3000)
                    }
                } else {
                    res(ipTrueOrFalse);
                }
            }

           check();
        });
    }

    this.checkIp = async ()  =>{
        const ip = await SequentialSerialManager.send({cmd: 'AT+SAPBR=2,1'});
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
                    await SequentialSerialManager.send({cmd: 'AT+HTTPINIT'});
                    await SequentialSerialManager.send({cmd: 'AT+HTTPPARA="CID",1'});
                }  catch (e) {}

                await SequentialSerialManager.send({cmd: 'AT+HTTPPARA="URL","'+url+'"'});
                responsecode =  await SequentialSerialManager.send({cmd: 'AT+HTTPACTION=0', afterok: 1, timeout: 20000});
                myRegexp = /,(\d.*),/g;
                match = myRegexp.exec(responsecode.res[1]);
                responsecode  = match[1];

                if (responsecode.startsWith('6')){
                    try { await SequentialSerialManager.send({cmd: 'AT+HTTPTERM'});}catch (e) {}
                    return {code: responsecode, content: 'ERROR'}
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

                try { await SequentialSerialManager.send({cmd: 'AT+HTTPTERM'});}catch (e) {}

                return {code: responsecode, content: content}
            } catch (e) {
                try { await SequentialSerialManager.send({cmd: 'AT+HTTPTERM'});}catch (e) {}
                return {code: 600, content: e}
            }


        } else {
            try { await SequentialSerialManager.send({cmd: 'AT+HTTPTERM'});}catch (e) {}

            return {code: 601, content: 'No hay IP'}
        }

    }

    this.hasInternet = async () => {
        try {
            result =  await this.httpGet('http://nppms.us/api/status');
            if (result.code === '200' && result.content === 'ACTIVO') {
                return true;
            }
        } catch (e) {}
        return false;
    }

};

util.inherits(GprsManager,events.EventEmitter)
module.exports.GprsManager = GprsManager;
