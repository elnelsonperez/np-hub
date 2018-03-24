#NP PMS - NP HUB Software
Este software es el que corre en los Hubs del sistema NP PMS.
Desarrollado por Nelson Pérez y Nathaly Persia como proyecto de grado. 2017-2018

>El objetivo general del NP PMS es Desarrollar un sistema de 
rastreo posicional para la Policía Nacional Dominicana que permita el
efectivo despliegue de unidades de patrullaje, administrado 
desde los destacamentos. 

>PMS Hub: Artefacto que se coloca en el vehículo policíaco y permite la obtención
 de información geo posicional, autenticación de policías  y conexión a Internet mediante un modulo GPRS.

La aplicacion esta desarrollada en Javascript con NodeJS, a excepcion de el manejo de bluetooth, que se
hace con la libreria PyBluez de Python.

######Recomendaciones previas
Es indispensable que conozcas lo que son [Callbacks](https://codeburst.io/javascript-what-the-heck-is-a-callback-aba4da2deced?gi=c209d2e9c41b),
[Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) y 
[Async/Await](https://hackernoon.com/6-reasons-why-javascripts-async-await-blows-promises-away-tutorial-c7ec10518dd9)
en Javascript para entender el flujo de la aplicacion.

######Notas sobre archivos no utilizados
Existen unos archivos en `app/modules`, `app/core` y `lib` relacionados a una pantalla LCD 20x4 que inicialmente 
era parte del proyecto. En esta version la pantalla LCD no se esta utilizando, por lo que cualquier bloque de codigo
que haga referencia a la LCD puede ser ignorado, a menos que quieras utilizarla. En ese caso, escribenos y agregaremos
la LCD y el directorio `modules` a este readme.

##Componentes físicos
* Raspberry Pi 3 Model B V1.2 2015
* Modulo GPRS SIMCOM 800c Shield 
* Modulo GPS U-blox 6M
* [Ibutton Reader DS9092](https://www.ebay.com/sch/i.html?_odkw=ibutton+reader&_osacat=0&_from=R40&_trksid=p2045573.m570.l1313.TR0.TRC0.H0.XDS+9092+ibutton+reader.TRS1&_nkw=DS+9092+ibutton+reader&_sacat=0)

![Diagrama 1](images/diagram1.png)

####Configuración en la Pi
*Este documento asume que tienes conocimientos basicos de Linux*
En esta seccion se explica como hacer el setup inicial con la Pi para correr el proyecto.

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
sudo pip install pexpect
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

#####Instalar Yarn
Yarn hace la instalacion de dependencias (librerias requeridas para que el proyecto funcione) mas rapida que NPM.
Si te interesa leer sobre porque usar Yarn en ves de NPM, checa [esto.](https://www.keycdn.com/blog/npm-vs-yarn/)

```bash
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install yarn -y
```

O sigue [las instrucciones oficiales de Yarn para Debian.](https://yarnpkg.com/lang/en/docs/install/#linux)

#####Git (Opcional)
Supongo que vas a instalar el proyecto haciendo un pull desde Git. Para eso, necesitas git en la Pi.
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
desde la pc hasta la Pi, por SSH.

 _Modificar IPs y rutas a la siguiente configucacion_
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

##Ya instale todo, ¿y ahora?
* Primero, luego de tener los archivos del proyecto en la Pi, tenemos que instalar las dependencias del
proyecto. 
Ubicate en el directorio del proyecto y corre `yarn`.
* Cuando las dependencias terminen de ser instaladas, el proyecto se corre desde al archivo `app.js`, haciendo
`node app.js`.
* Puedes correrlo con cualquiera de los siguientes parametros adicionales: (Por ej: `node app.js --noAuth`)
    * `--noLocations`: No enviar localizaciones GPS.
    * `--verbose`: Que aparezca cuando se corre cada Task en la consola.
    * `--hideGprs`: Ocultar output del GPRS en consola.
    
######¿Que es lo que sucede cuando el programa corre?
Se ejecutan las siguientes operaciones.

1. Se inicializan los modulos GPRS y Bluetooth.
2. El GPRS hace una solicitud inicial a `nppms.us/status` para confirmar dos cosas
    * El modulo GPRS esta funcionando.
    * El modulo GPRS realmente tiene conexion a Internet.
3. Se descargan las configuraciones para este hub desde el servidor.
El servidor sabe que configuraciones entregar porque cada Hub registrado se asocia a un
serial de la Pi.
4. El Bluetooth se pone disponible para recibir conexiones de la App movil y se envian las localizaciones 
obtenidas por el GPS, si hay alguna disponible para enviar.
    
En este punto, la app podra conectarse al Hub. Luego de conectarse, periodicamente se hacen solicitudes al servidor
para traer incidentes, configuraciones nuevas, o nuevos mensajes.

Si necesitas mas detalles del "orden" en el que corre el codigo,
inicia desde `app.js`, el punto de entrada a la aplicacion, a leer los comentarios del codigo.
Cada seccion indica cuando corre. 

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

 + Decidir cada cuando tiempo desea ser corrida por el motor de la aplicacion luego de la ultima
  vez que se corrio la tarea.
 + Utilizar cuantos Servicios sean necesarios.
 + Disparar eventos que sean escuchados de manera asincrona en otra seccion de la aplicacion.
 + Almacenar data que persiste en cada iteracion del task.
  
Cada **Task** necesariamente tiene que contar con una funcion `run` que retorne una [Promesa o Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
Esta funcion sera la que el motor de la aplicacion llamara periodicamente para correr la tarea.

Tambien puede contener una funcion `initialize` si necesita inicializar algo antes de que
el motor comience a correr la tarea (ejecutando `run`) de manera periodica. 
 
Tomando el ejemplo de recolectar localizaciones GPS, es necesario recalcar que el task
no sabe _como_ obtener localizaciones GPS; esta responsabilidad es delegada a un Servicio.
Sin embargo, la tarea si sabe _cuando_ utilizar el servicio y que hacer con el resultado que devuelva. 
 
 
