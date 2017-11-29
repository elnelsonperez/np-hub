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

* La patalla 20x4 esta definida por cuatro objetos **Line**. Cada uno de ellos poseyendo un metodo que,
al ser llamado, ejectuta todos los modulos pertenecientes a esa linea y retorna el string completo a renderizar en 
pantalla por la libreria que controla la LCD.

* Es responsabilidad del Modulo indicar en que espacio de la pantalla quiere que este su output, 
y es responsabilidad del objeto Line de ejecutar cada modulo que halla solicitado estar en esa linea, 
y escribir su output a la pantalla.
  
La aplicacion funciona siguiendo un paradigma que se asemeja al
 [https://es.wikipedia.org/wiki/Inversi%C3%B3n_de_control](IoC). Un objeto llamado **Application** se encarga de cargar
 las entidades que h
 
##Estructura de directorios
La carpeta *lib* contiene todos los archivos que funcionan como librerias para la aplicacion. 

El directorio *storage* es para almacenamiento. Ya sea de la base de datos local o cualquier otro recurso que requiera
ser almacenado.

El directorio *app/* contiene los ficheros para las entidades principales, **Modulos**, **Tasks**, y **Lines**.

La carpeta *modules* tiene subdirectorios que representan una pantalla. Para cambiar de pantalla en la aplicacion,
basta con cargar los modulos de un directorio adyacente.

La carpeta *tasks* contiene todos los procesos de fondo que van a correr en la aplicacion. 





