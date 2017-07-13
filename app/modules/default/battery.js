
const appModule = {
    name : 'battery',
    start : 10,
    end : 14,
    line : 1,
    scrolling: false,

    view (level) {
        let res = "";
        if (level === 1) {
            res = '\x07\x00';
        }
        if (level === 2) {
            res = '\x07\x00\x01';
        }
        if (level === 3) {
            res = '\x07\x00\x01\x02';
        }
        return res;
    },

    controller () {
        return this.view( this.test());
    },

    test () {
      return Math.floor((Math.random() * 3) + 1);
    }

};

module.exports = appModule;