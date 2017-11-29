#NP PMS - Tracking Module Software
Este software es el que corre en los equipos de rastreo de nuestro (Nathaly R. Persia
y Nelson Perez) proyecto de grado.

>El NP Police Management System pretende mejorar el sistema de patrulla policial de la ciudad de Santiago desarrollando un nuevo sistema de rastreo, gestión, y monitoreo policial. El enfoque de este sistema es que pueda ser implementado en las principales unidades de vigilancia; vehículos de cuatro ruedas o unidades policiales a pie, en un esquema que, conociendo la posición, estado, y personal a bordo de la unidad,  permita el efectivo despliegue de unidades policiacas en las zonas que más lo necesiten. 

Decidimos diseñar esta aplicacion de manera que fuera facilmente customizable al
momento de hacer mejoras o ajustes al proyecto en fases mas avanzadas de su desarrollo.

##Componentes
Este proyecto esta hecho para correrse en una Raspberry PI 3.
Es necesario tener instalado Node.js v8 en adelante y NPM, que viene incluido con Node.
Los esquemas de circuito relevantes con los que funciona esta proyecto son los siguientes.

>To do

##Arquitectura del software
La ideas principales son las siguientes:

* Cada recuadro, o grupo de recuadros por linea de la pantalla de 20x4 que utiliza el 
proyecto, es un string retornado de algun bloque de codigo que se ejecuta cada cierto tiempo.
Estos bloques de codigo que procesan algo y escupen un output en forma de texto seran llamados **Modulos**,
y la pantalla se compondra por varios de ellos. 

* Hay tareas que tienen que realizarse continuamente (como la recoleccion de localizaciones GPS)
que no necesitan tener una salida directa a la pantalla. Estos tipos 
de *background processes* son llamados **Tasks**.

* La pantalla 20x4 esta definida por cuatro objetos **Line**. Cada uno de ellos poseyendo un metodo (*getProcessedLine*) que,
al ser llamado, ejectuta todos los modulos pertenecientes a esa linea y retorna el string completo a renderizar en 
pantalla por la libreria que controla la LCD.

* Es responsabilidad del Modulo indicar en que espacio de la pantalla quiere que este su output, 
y es responsabilidad del objeto Line de ejecutar cada modulo que halla solicitado estar en esa linea.

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
//app/modules/demo/battery.js
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
4. Correr con `node index.js`.