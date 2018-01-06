const Sqlite = require('sqlite3').verbose()
let instance = null
class Database {
  constructor(){
    if(instance){
      return instance
    }
    this.conn = new Sqlite.Database(__dirname+"/../storage/database.db");
    instance = this;
  }
}
module.exports = new Database();