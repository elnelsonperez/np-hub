
module.exports = function () {
    this.data = {};
    this.writers = [];
    this.scrolling = false;
    this.scrollingStarted = null;

    this.setWriter = function (module) {

        if (module.scrolling)
            this.scrolling = true;

        this.writers.push({
                start: module.start,
                end: module.end,
                module: module,
                length: module.end-module.start
            })

    };

    this.getProcessedLine = function () {

        if (this.scrolling) {
            return this.writers[0].module.controller();
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

        return result;
    };

};