const Lcdlib = require('./lib/lcd');
const lcd = new Lcdlib.LcdController( 1, 0x3f, 20, 4 );

lcd.printlnScroll('Hello How are my good man')