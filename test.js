const serialManager = require('./lib/serial').serialManager;
const sm = new serialManager(true);

Object.prototype.responseContains = function (val) {
    return this.res.find(v => {
        return v === val;
    });
};

const gprs =  require('./lib/gprs').GprsManager;
const manager = new gprs(sm);
manager.initialize().then(() => {
    manager.httpGet('http://httpbin.org/ip').then (res => console.log(res))
});




// async function doit() {
//     try {
//         console.log(await serialManager.send('AT+CMEE=2',null,true));
//
//         console.log(await serialManager.send('AT+CPIN?',null,true));
//         console.log(await serialManager.send('AT+CREG?',null,true));
//
//
//         const networkAttach = await serialManager.send('AT+CGATT?',null,true);
//         if (networkAttach.responseContains('+CGATT: 0')) {
//             console.log( await serialManager.send('AT+CGATT=1',null,true));
//         }
//
//
//         const cipmux =  await serialManager.send('AT+CIPMUX=?',null,true);
//         if (!cipmux.responseContains('+CIPMUX: (0,1)')){
//             console.log(await serialManager.send('AT+CIPMUX=0',null,true));
//         }
//
//         console.log( await serialManager.send('AT+CIPSTATUS',null,true,1));
//
//
//         const cstt =  await serialManager.send('AT+CSTT=?',null,true);
//         if (!cstt.responseContains('STATE: IP GPRSACT')){
//             console.log( await serialManager.send('AT+CSTT="internet.ideasclaro.com.do"',null,true));
//         }
//
//         const ip = await serialManager.send('AT+SAPBR=2,1',null,true);
//         console.log(ip);
//         myRegexp = /"((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))"/g;
//         match = myRegexp.exec(ip.res[0]);
//         if (match[0] === '"0.0.0.0"') { //inValida
//             ciicr = await serialManager.send('AT+CIICR',null,true);
//             console.log(ciicr);
//             console.log(await serialManager.send('AT+SAPBR=3,1',null,true));
//             console.log(await serialManager.send('AT+SAPBR=3,1,"Contype","GPRS"',null,true));
//             console.log(await serialManager.send('AT+SAPBR=1,1',null,true));
//         }
//
//         setInterval(async function () {
//             console.log(await serialManager.send('AT+CIPGSMLOC=1,1',null,true));
//         },2000)
//
//
//         //
//         //
//         // console.log(await serialManager.send('AT+HTTPINIT',null,true));
//         // console.log(await serialManager.send('AT+HTTPPARA="CID",1',null,true));
//         // console.log(await serialManager.send('AT+HTTPPARA="URL","http://httpbin.org/anything"',null,true));
//         // console.log(await serialManager.send('AT+HTTPACTION=0',null,true,1));
//         //
//         // { cmd: 'AT+HTTPACTION=0', res: [ 'OK', '+HTTPACTION:0,601,0' ] }
//         // console.log(await serialManager.send('AT+HTTPREAD',null,true));
//         // console.log(await serialManager.send('AT+HTTPTERM',null,true));
//
//     }catch (e) {
//         console.log(e)
//     }
// }
//
// doit();




