/**
 * Este file exporta una instancia al driver de la base de datos de Sqlite usada para
 * almacenar cosas localmente.
 * Por ahora solo crea la tabla utilizada por el RequestsQueueService.
 */

const Sqlite = require('sqlite3').verbose()
let instance = null
class Database {
  constructor(){
    if(instance){
      return instance
    }
    this.conn = new Sqlite.Database(__dirname+"/../storage/db.db");
    instance = this;

    try {
      this.conn.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='queue'`, (err, row) => {
        if (err)
          console.log(err)

        if (!row) {
          this.conn.run(`
          CREATE TABLE queue (
    id integer PRIMARY KEY,
    url text NOT NULL,
    method text NOT NULL,
    payload text NOT NULL,
    priority integer default 0,
    event_name text,
    status integer default 0,
    auto_discard integer default 0,
    retry_counter integer default 0,
    date datetime default CURRENT_TIMESTAMP
);
CREATE INDEX index_priority ON queue (priority);
CREATE INDEX index_status ON queue (status);`)
        }
      })
    }
    catch (e) {
     console.log(e)
    }
  }
}
module.exports = new Database();