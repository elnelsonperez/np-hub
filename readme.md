#NP PMS - Tracking Module Software
Este software es el que corre en los Hubs del sistema NP PMS.
Desarrollado por Nelson Pérez y Nathaly Persia como proyecto de grado. 2017-2018

>El objetivo general del NP PMS es Desarrollar un sistema de 
rastreo posicional para la Policía Nacional Dominicana que permita el
efectivo despliegue de unidades de patrullaje, administrado 
desde los destacamentos. 

La aplicacion esta desarrollada en Javascript con NodeJS, a excepcion de el manejo de bluetooth, que se
hace con la libreria PyBluez de Python.

######Recomendaciones previas
Es indispensable que conozcas lo que son [Callbacks](https://codeburst.io/javascript-what-the-heck-is-a-callback-aba4da2deced?gi=c209d2e9c41b),
[Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) y 
[Async/Await](https://hackernoon.com/6-reasons-why-javascripts-async-await-blows-promises-away-tutorial-c7ec10518dd9)
en Javascript para entender el flujo de la aplicacion.

##Componentes físicos
Este proyecto esta hecho para correrse en una Raspberry PI 3.
Los esquemas de circuito relevantes son los siguientes.

>To do

####Configuración en la Pi
*Este documento asume que tienes conocimientos basicos de Linux*

#####Notas
* Recomendamos que la Pi corra [Raspbian Stretch Lite March 2018](https://www.raspberrypi.org/downloads/raspbian/).
* Esta version de Raspbian no tiene interface desktop, lo que la hace muy rapida. [Este articulo](https://hackernoon.com/raspberry-pi-headless-install-462ccabd75d0) indica como conectarse a la Pi luego de descargar raspbian. 
* Es recomendable configurar una IP estatica para no tener que encontrar la IP asignada a la pi
cada vez que bootea y se conecta a la red. Para ello, se puede seguir la seccion **dhcpcd method**
 de [este tutorial](https://raspberrypi.stackexchange.com/questions/37920/how-do-i-set-up-networking-wifi-static-ip-address/74428#74428)

#####Bluetooth en Raspbian Stretch
El NP Hub utiliza el bluetooth de la Pi para comunicarse con el smartphone.
Para poder utilizar el bluetooth de la manera que queremos, es necesario seguir 
las instrucciones siguientes. (Comandos a correr en la Pi)

Conectate a la Pi por SSH. Si no has cambiado el default password, es 'raspberry'
```bash
ssh pi@[IP DE LA PI]
```

Actualizar.
```bash
sudo apt-get update && sudo apt-get upgrade
```

Arreglar un problema del bluetooth con Raspbian Stretch.
```text
sudo sed -i 's|^ExecStart=/usr/lib/bluetooth/bluetoothd$|ExecStart=/usr/lib/bluetooth/bluetoothd --noplugin=sap|' /lib/systemd/system/bluetooth.service
sudo service bluetooth restart
sudo systemctl daemon-reload
```

Agregar usuario pi al grupo bluetooth.
```bash
sudo adduser pi bluetooth
sudo reboot
```

Instalar librerias necesarias.
```bash
sudo apt-get install libbluetooth-dev python-dev python-pip -y
sudo pip install PyBluez
```

En este punto el bluetooth deberia estar funcionando correctamente.
Compruebalo haciendo :
```bash
pi@raspberrypi:~ $ bluetoothctl
[NEW] Controller B8:27:EB:02:33:C2 raspberrypi [default] <--- Todo bien.
[bluetooth]# 
```
#####Ibuttons y protocolo 1Wire con la pi

Agregar lo siguiente antes de *exit 0* en el archivo `/etc/rc.local` (editar con sudo)
```text
sudo chmod a+w /sys/devices/w1_bus_master1/w1_master_slaves
sudo chmod a+w /sys/devices/w1_bus_master1/w1_master_remove
sudo chmod a+w /sys/devices/w1_bus_master1/w1_master_search
```
Esto se asegurara de que los permisos para trabajar con el protocolo 1Wire sean establecidos 
cuando la Pi bootee.

Es necesario editar el siguiente archivo para hacer que las lecturas con 1Wire sean mas rapidas:
```bash
sudo nano /etc/modprobe.d/w1.conf
```
Y agregar:
```text
options wire timeout=1 slave_ttl=1
```

#####Instalando NodeJs y NPM
```bash
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#####Git (Opcional)
```bash
sudo apt-get install git -y
```
#####Lsyncd (Opcional)
*El siguiente paso es totalmente opcional, pero muy recomendado y te ahorrara mucho tiempo luego.*

Yo recomendaria utilizar algun metodo para copiar automaticamente los cambios hechos en el proyecto
desde tu PC hacia la Pi. Esto hace el proceso muy rapido porque toda la programacion puede ser 
realizada desde tu PC y al guardar el proyecto localmente, automaticamente se copia a la Pi.

En nuestro caso, utilizamos [lsyncd](https://www.digitalocean.com/community/tutorials/how-to-mirror-local-and-remote-directories-on-a-vps-with-lsyncd).
Y adjunto dejo una configuracion de ejemplo para copiar los cambios hechos al proyecto
desde la pc hasta la Pi, por SSH (Modificar IPs y rutas).

```text
-- /etc/lsyncd/lsyncd.conf.lua

settings{
        logfile = "/var/log/lsyncd/lsyncd.log",
        statusFile = "/var/log/lsyncd/lsyncd.status",
        statusIntervall = 1,
}

sync{
        default.rsyncssh,
        source = "/home/nel/nphub",
        targetdir = "/home/pi/nphub",
        host = "pi@192.168.1.153",
        delay           = 1,
        exclude = {"node_modules",".idea",".git"},
        rsync={rsh="/usr/bin/ssh  -o StrictHostKeyChecking=no"}
}
```

Para que esta configuracion funcione, es necesario copiar el SSH Key del usuario Root de tu maquina
a la Pi. Al hacer esto, no es necesario introducir passwords al conectarse por SSH con la Pi.
Si no entiendes estos conceptos, [mira este articulo.](https://www.raspberrypi.org/documentation/remote-access/ssh/passwordless.md).


**En este punto la pi deberia estar lista para correr el proyecto.** 
##Arquitectura del software
Desde el inicio fue prioridad que los componentes de esta aplicacion fueran faciles de modificar 
o extender, por lo que el codigo esta separado segun su funcionalidad y el tipo de operacion
que realiza cuando la aplicacion esta corriendo.

La ideas principales son las siguientes:

######Services
El lugar donde se agrupan funciones que sirven para un proposito especifico, como por ejemplo,
enviar un mensaje o leer del iButton reader, es llamado **Servicio** o **Service**.
Un Service puede ser llamado de cualquier parte en la aplicacion, y su proposito principal es 
**agrupar funcionalidad**.

######Tasks
Hay tareas que tienen que realizarse continuamente (como la recoleccion de localizaciones GPS). 
Estos tipos de *background processes* son llamados **Tasks** en el contexto de esta aplicacion.

Entre las cosas que puede hacer un **Task** estan:
  - Decidir cada cuando tiempo desea ser corrida por el motor de la aplicacion luego de la ultima
  vez que se corrio la tarea.
  - Utilizar cuantos Servicios sean necesarios.
  - Disparar eventos que sean escuchados de manera asincrona en otra seccion de la aplicacion.
  - Almacenar data que persiste en cada iteracion del task.
  
Cada **Task** necesariamente tiene que contar con una funcion `run` que retorne una [Promesa o Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
Esta funcion sera la que el motor de la aplicacion llamara periodicamente para correr la tarea.

Tambien puede contener una funcion `initialize` si necesita inicializar algo antes de que
el motor comience a correr la tarea (ejecutando `run`) de manera periodica. 
 
Hasta aqui llegue 22/03/18
---
  
  ...
  Un objeto llamado **Application** se encarga de inicializar y/o cargar tasks, modulos y librerias al momento del boot.
  Deja las Tasks corriendo en el background y ejecuta un *application loop* mientras la aplicacion este viva.
 
  El application loop simplemente maneja el input del usuario para tomar las acciones pertinentes, y ejecuta la funcion 
  *getProccesedLine* para printear o "renderizar" cada output a cada linea de la pantalla con la libreria que maneja la LCD.
 
 El objetivo de esta estrategie es crear una especie de *engine* que no necesite ser tocado en el desarrollo del proyecto,
 y que todo pueda ser manejado agregando mas pantallas (directorios de Modulos) o Tasks segun se requieran nuevas funcionalidades.
 
##Estructura de directorios
La carpeta *lib* contiene todos los archivos que funcionan como librerias para la aplicacion. 

El directorio *storage* es para almacenamiento. Ya sea de la base de datos local o cualquier otro recurso que requiera
ser almacenado.

El directorio *app/* contiene los ficheros para las entidades principales, **Modulos**, **Tasks**, y **Lines**.

La carpeta *modules* tiene subdirectorios que representan una pantalla. Para cambiar de pantalla en la aplicacion,
basta con cargar los modulos de un directorio adyacente.

La carpeta *tasks* contiene todos los procesos de fondo que va a correr en la aplicacion. 

##Crear nuevos Modulos de la pantalla
Es tan sencillo como crear un nuevo directorio en la carpeta `modules` y extender el objeto `appModule`.
Por ejemplo un modulo para mostrar el nivel de bateria en la esquina superior izquierda de la pantalla:

```javascript
batteryModule.jsule.js
const ApplicationModule  = require('../../core/module').ApplicationModule

const appModule = new ApplicationModule (
    {
        name : 'battery',
        start : 0,
        end : 4,
        line : 1
    }
);

//This is the function that the Line object calls to get the string to print.
appModule.controller = function () {
//Here you would somehow fetch the battery level.
    return this.outputView(3); //Constant battery level for demo.
}

appModule.outputView = function (level) {
    let res = ""
    if (level === 1) {
        res = 'Bat 1'
    }
    if (level === 2) {
        res = 'Bat 2'
    }
    if (level === 3) {
        res = 'Bat 3'
    }
    return res;
}

module.exports = appModule;
```
Luego, con `Application.initialize(demo)` podemos inicializar la aplicacion con los
modulos del directorio 'demo' como pantalla por defecto, y cambiar pantallas con
`Application.switchModuleDomain(name)`.

##Crear nuevos Tasks
De la misma forma que los modulos, extendiendo el objeto base **Task**, y definiendo un metodo`run` que sera ejecutado por
la aplicacion cada `Task.every` milisegundos.

```javascript
const Task  = require('./../core/task').Task

const ConsoleLogger = new Task (
    {
        name: 'GpsSenderTask',
        every: 10000, // Wil run every 10 seconds
    }
);

GpsSenderTask.run = function () {
    this.emit('ConsoleLoggerRan') //Anyone waiting for me to do something? Emit event.
    console.log('Task has been ran.')
}

module.exports = GpsSenderTask;
```


##So, how in the WORLD do I even run this? - Como correrlo.
1. Necesitas tener los componentes armados arriba en la configuracion presentada.
2. `git clone ` the repository.
3. `npm install` or `yarn` para instalar las dependencias.
4. Correr con `node app.js`.