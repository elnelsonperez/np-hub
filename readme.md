#NP PMS - Tracking Module Software
Este software es el que corre en los Hubs del sistema NP PMS.
Desarrollado por Nelson Pérez y Nathaly Persia como proyecto de grado. 2017-2018

>El objetivo general del NP PMS es Desarrollar un sistema de 
rastreo posicional para la Policía Nacional Dominicana que permita el
efectivo despliegue de unidades de patrullaje, administrado 
desde los destacamentos. 

*Todos los ejemplos que se den luego de este punto asumen que tienes Ubuntu 16.04 como entorno
de desarrollo*

##Componentes físicos
Este proyecto esta hecho para correrse en una Raspberry PI 3.
Los esquemas de circuito relevantes son los siguientes.

>To do

####Configuración en la Pi
######Notas
* Recomendamos que la Pi corra [Raspbian Stretch Lite](https://www.raspberrypi.org/downloads/raspbian/).
* Esta version de Raspbian no tiene interface desktop, lo que la hace muy rapida. [Este articulo](https://hackernoon.com/raspberry-pi-headless-install-462ccabd75d0)indica como conectarse a la Pi luego de descargar raspbian. 
* Es recomendable configurar una IP estatica para no tener que encontrar la IP asignada a la pi
cada vez que bootea y se conecta a la red. Para ello, se puede seguir la seccion **dhcpcd method**
 de [este tutorial](https://raspberrypi.stackexchange.com/questions/37920/how-do-i-set-up-networking-wifi-static-ip-address/74428#74428)

######Lsyncd (Opcional)
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

######Bluetooth en Raspbian Stretch
El NP Hub utiliza el bluetooth de la Pi para comunicarse con el smartphone.
Para poder utilizar el bluetooth de la manera que queremos, es necesario seguir 
las instrucciones siguientes. (Comandos a correr en la Pi)

Primero actualiza tu pi.
```bash
sudo apt-get update && sudo apt-get upgrade
```

Arreglar un problema del bluetooth con la Pi.
```text
sudo sed -i 's|^ExecStart=/usr/lib/bluetooth/bluetoothd$|ExecStart=/usr/lib/bluetooth/bluetoothd --noplugin=sap|' /lib/systemd/system/bluetooth.service
```

Agregar usuario pi al grupo bluetooth,
```bash
sudo adduser pi bluetooth
sudo reboot
```

Instalar librerias necesarias.
```bash
sudo apt-get install libbluetooth-dev
sudo apt-get install python-dev
sudo pip install PyBluez
```

##Arquitectura del software
La ideas principales son las siguientes:

* Hay tareas que tienen que realizarse continuamente (como la recoleccion de localizaciones GPS)
que no necesitan tener una salida directa a la pantalla. Estos tipos 
de *background processes* son llamados **Tasks**.

* La pantalla 20x4 esta definida por cuatro objetos **Line**. Cada uno de ellos poseyendo un metodo (*getProcessedLine*) que,
al ser llamado, ejectuta todos los modulos pertenecientes a esa linea y retorna el string completo a renderizar en 
pantalla por la libreria que controla la LCD.

* Es responsabilidad del Modulo indicar en que espacio de la pantalla quiere que este su output, 
y es responsabilidad del objeto Line de ejecutar cada modulo que haya solicitado estar en esa linea.

* Cada modulo tiene la posibilidad de escuchar eventos de otros modulos que hayan sido cargados.
Esto crea una red de modulos no acoplados, pero comunicados unos con otros, que agrega flexibilidad al sistema.
  
La aplicacion funciona siguiendo un paradigma que se asemeja al
 [IoC](https://es.wikipedia.org/wiki/Inversi%C3%B3n_de_control).
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