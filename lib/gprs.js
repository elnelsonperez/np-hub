
Object.prototype.responseContains = function (val) {
    return this.res.find(v => {
        return v === val;
    });
};

module.exports.GprsManager = function (serialManager) {

    this.mandatoryCommand = async function (promise, args, delay, message) {
        return new Promise (res => {
            function doIt() {
                promise(args).then(res).catch(e => {
                    if (message)
                        console.log(message);
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

        this.obtainIpAdress();

    };


    this.obtainIpAdress = async () => {
        return new Promise(res => {
            check = async () => {
                let ip = await this.checkIp();
                if (!ip) {
                    const apn = await serialManager.send({cmd: 'AT+CIPSTATUS', afterok: 1});
                    if (!apn.responseContains('STATE: IP GPRSACT')) {
                        if (apn.responseContains('STATE: IP START')) {
                            try {
                                ciicr = await serialManager.send({cmd: 'AT+CIICR',timeout: 6000,
                                    expect: ["+CME ERROR: operation not allowed", "OK"]});
                            }  catch (e) {}
                            try {
                                await serialManager.send({cmd: 'AT+SAPBR=3,1'});
                            }  catch (e) {}
                            try {
                                await serialManager.send({cmd: 'AT+SAPBR=3,1,"Contype","GPRS"'});
                            }  catch (e) {}
                            try {
                                await serialManager.send({cmd: 'AT+SAPBR=1,1'});
                            }  catch (e) {}
                        }
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
        return !match[0] === '"0.0.0.0"'
    }


    this.httpGet = async (url, params) => {
        console.log(await serialManager.send('AT+HTTPINIT',null,true));
        console.log(await serialManager.send('AT+HTTPPARA="CID",1',null,true));

        if (params) {
            url = url + "?params="+encodeURIComponent(JSON.stringify(params));
        }

        console.log(await serialManager.send('AT+HTTPPARA="URL","'+url+'"',null,true));

        responsecode = await serialManager.send('AT+HTTPACTION=0',null,true,1);
        myRegexp = /,(\d.*),/g;
        match = myRegexp.exec(responsecode.res[1]);
        responsecode  = match[0];

        result = await serialManager.send('AT+HTTPREAD',null,true);
        if (result) {
            content = result[1];
        } else {
            result = "";
        }
        console.log(await serialManager.send('AT+HTTPTERM',null,true));

        return {code: responsecode, content: content}
    }

};