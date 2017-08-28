const LCD = require('lcdi2c');


module.exports.LcdController = function (a, b, c, d, backlight = true) {
    this.lcd = new LCD( a, b, c, d );
    this.lineTimers = {};
    this.clear = function () {
      this.lcd.clear();
    };

    if (backlight === true) {
        this.lcd.on()
    }

    this.println = function (text, line, centered = false) {
        if (text.length > 20) {
            this.printlnScroll(text,line)
        } else {
            let padding = "";
            if (centered) {
                const paddingAmount =  (20 - text.length) / 2;
                for (let i =0; i< paddingAmount; i++) {
                    padding+= " ";
                }
            }

            this.lcd.println( padding+text, line );
            if ( this.lcd.error ) {
                this.lcdErrorHandler( line, this.lcd.error );
            }
        }

    };

    this.stopScroll = function(lineNumber) {
        if (lineNumber === null) {
          for (let line of Object.keys(this.lineTimers)) {
            clearInterval(this.lineTimers[line].timerId)
          }
        } else {
          clearInterval(this.lineTimers[lineNumber].timerId)
        }
    }

    this.printlnScroll = function (text, line = 1, speed = 2.2, invertirDir = false) {
        const realtext = "                    " + text + " ";
        const length = realtext.length;
        let i = 1;
      this.lineTimers[line].timerId = setInterval(() => {
            const toPrint = realtext.substr(invertirDir ? length - i : i);
            this.lcd.println(toPrint, line);
            if (i < length - 1)
                i++;
            else
                i = 0;
        },speed*100);

    };

    this.lcdErrorHandler = function (line, error) {
        console.log( 'Error al imprimir linea '+line+': "'+error +'"')
    };

    this.backLight = function (mode = true) {
        if (mode) {
            this.lcd.on()
        } else {
            this.lcd.off()
        }
    };

    this.customChar = function () {
        this.lcd.
            createChar( 0, [ 0x0,0x0,0x0,0x0,0x0,0x0,0x1f] )
            .createChar( 1, [0x0,0x0,0x0,0x0,0x0,0x1f,0x1f] )
            .createChar( 2, [0x0,0x0,0x0,0x0,0x1f,0x1f,0x1f] )
            .createChar( 3, [ 0x0,0xe,0x15,0x17,0x11,0xe,0x0,0x0] ) //clock
            .createChar( 4, [ 0x0,0x8,0xc,0xe,0xc,0x8,0x0,0x0] ) //right arrow
            .createChar( 5, [0x0,0x2,0x6,0xe,0x6,0x2,0x0,0x0] ) //left arrow,
            .createChar(6,  [0x0,0x0,0x1b,0xa,0x4,0x4,0x4,0x4]) //signal
            .createChar(7, [0x0,0x0,0xc,0x1e,0x1e,0x1e,0x1e,0x1e]) //battery
        ;
    }

};