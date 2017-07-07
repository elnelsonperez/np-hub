
const appModule = {
    name : 'whatever',
    start : 0,
    end : 20,
    line : 3,
    scrolling: true,

    view (a) {

        return a;
    },

    controller () {
        return "Mensaje de prueba";
    },



};

module.exports = appModule;