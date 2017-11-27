const Sqlite = require('sqlite3')

module.exports.UserManager = function () {

    this.getDatabaseInstance = function () {
        return new Sqlite.Database('./../storage/database').verbose;
    }

    this.addNewUser = function ({name, extcode, ibutton}) {
        const db = this.getDatabaseInstance();
        db.serialize(function () {
            const stmt = db.prepare("INSERT INTO usuarios(nombre, id_ext, ibutton) VALUES (?,?,?)");
            stmt.run([name, extcode, ibutton])
            stmt.finalize();
        })
        db.close();
    }


    this.removeUserByIbutton = function (ibutton) {
        const db = this.getDatabaseInstance();
        return new Promise( (res,rej) => {
            db.run('DELETE FROM usuarios WHERE ibutton = ?',[ibutton],function (err) {
                if (!err)
                    res(result)
                else
                    rej(err)
            });
        })
    }

    this.clearUsers = function () {
        const db = this.getDatabaseInstance();
        return new Promise( (res,rej) => {
            db.run("DELETE FROM usuarios", function (err) {
                if (err)
                    rej(err)
                res();
            });
        })
    }

    this.getUserByIbutton = function (ibutton) {
        const db = this.getDatabaseInstance();
        return new Promise( (res,rej) => {
            db.get('SELECT * FROM usuarios WHERE ibutton = ?',[ibutton],function (err, result) {
                if (!err)
                    res(result)
                else
                    rej(err)
            });
        })
    }

}
