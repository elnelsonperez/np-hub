
module.exports = function () {
    this.data = {};
    this.writers = [];
    this.scrolling = false;
    this._lastProcessedLine = null;
    this.changed = false;

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


    this.removeWriter = function (module) {
        for(let i = 0; i < this.writers.length; i++) {
            if(this.writers[i].module.name === module.name) {
                data.splice(i, 1);
                break;
            }
        }
    };

    this.getProcessedLine = function () {

        if (this.scrolling) {
            let result = this.writers[0].module.controller();
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