/**
 * This object represents a line in the screen
 */

module.exports = function () {
    this.data = {}; //Actual line data
    this.writers = []; //Array of line writers/modules
    this.scrolling = false; //Is this line currently scrolling?
    this._lastProcessedLine = null; //Detect if text being displayed has changed
    this.changed = false;

    //A line writer is just a more convenient way to represent a module in this context.
    this.setWriter = function (module) {

        if (module.scrolling)
            this.scrolling = true;
        else
            this.scrolling = false;

        this.writers.push({
                start: module.start,
                end: module.end,
                module: module,
                length: module.end-module.start
            })

    };

    /**
     * Remove line writer by name
     * @param {string} module 
     */
    this.removeWriter = function (module) {
        for(let i = 0; i < this.writers.length; i++) {
            if(this.writers[i].module.name === module.name) {
                data.splice(i, 1);
                break;
            }
        }
    };

    /**
     * Function that runs each module of this line, collects a combined output, and returns it.
     * @returns {string}
     */
    this.getProcessedLine = function () {

        if (this.scrolling) {
            let result = this.writers[0].module.controller();
            if (result.length < 20) {
                for (let i = 0; i < 20 - result.length;i ++) {
                    result+=" ";
                }
            }
            if (this._lastProcessedLine !== result) {
                this.changed = true;
                this._lastProcessedLine = result;
            }else {
                this.changed = false;
            }
            return result;
        }

        for (let wr of this.writers) {
            const res = wr.module.controller();

            if ((typeof res) === 'string' )  {
                let i = 0;
                for (let o = wr.start ; o < wr.end; o++) {
                    this.data[o.toString()] = res[i++];
                }
            } else {
                for (let o = wr.start ; o < wr.length; o++) {
                    this.data[o.toString()] = 'X';
                }
            }
        }

        let result = "";
        for (let i = 0; i < 20 ; i++ ) {
            if (this.data[i.toString()])
               result += this.data[i.toString()];
            else
                result += " ";
        }


        if (this._lastProcessedLine !== result) {
            this.changed = true;
            this._lastProcessedLine = result;
        } else {
            this.changed = false;
        }

        return result;
    };

};