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
La ideas principales fueron las siguientes:
* Que cada recuadro, o grupo de recuadros por linea de la pantalla de 20x4 que utiliza el 
proyecto, sea un string retornado de algun bloque de codigo que podria ejecutarse en cualquier momento.
Estos bloques de codigo que procesan algo y escupen un output en forma de texto seran llamados**Modulos**,
y la pantalla se compondra por varios de ellos.
* Habran tareas que deberan realizarse continuamente (como la recoleccion de localizaciones GPS)
que no necesitan tener una salida directa a la pantalla. Estos tipos 
de *background processes* seran llamados **Tasks**.

