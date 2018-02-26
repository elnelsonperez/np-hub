const Database = require("./../core/Database")

const RequestQueueService = function () {
  this.table = "queue"
  const db = Database.conn
  this.addRequest = (
      {url, method, payload = {}, priority = RequestQueueService.PRIORITY_LOW, event_name = null,auto_discard =false}
  ) => {
    return new Promise((res,rej) => {
      try {
        const stmt = db.prepare(
            `INSERT INTO ${this.table}(url,method,payload,priority,event_name,auto_discard) 
            VALUES (?,?,?,?,?,?)`, [url,method,JSON.stringify(payload),priority,event_name, auto_discard === true ? 1 : 0])
        stmt.run(function () {
          res(this.lastID)
          console.log("New "+method+" | "+url+" added to queue")
        })
      }
      catch (e) {
        rej(e)
      }
    })
  }

  this.getRequestById = (id) => {
    return new Promise((res, rej) => {
      try {
        db.get(`SELECT * FROM ${this.table} WHERE id = `+id, (err, row) => {
          if (err)
            rej(err)
          res(row)
        })
      }
      catch (e) {
        rej(e)
      }
    })
  }

  this.getPendingRequestCount = () => {
    return new Promise((res, rej) => {
      try {
        db.get(`
        SELECT COUNT(*) FROM ${this.table} 
        WHERE status = ${RequestQueueService.STATUS_PENDING}`, (err, row) => {
          if (err)
            rej(err)
          res(row)
        })
      }
      catch (e) {
        rej(e)
      }
    })
  }

  this.getRetryCount = (id) => {
    return new Promise((res, rej) => {
      try {
        db.get(`
        SELECT retry_counter FROM ${this.table} 
        WHERE id = ${id}`, (err, row) => {
          if (err)
            rej(err)
          res(row.retry_counter)
        })
      }
      catch (e) {
        rej(e)
      }
    })
  }

  //The one with the most priority
  this.getNextRequest = (status = RequestQueueService.STATUS_PENDING) => {
    return new Promise((res, rej) => {
      try {
        db.get(`
        SELECT * FROM ${this.table} 
        WHERE status = ${status} 
        ORDER BY date ASC,priority DESC`, (err, row) => {
          if (err)
            rej(err)
          const obj = row;
          if (obj){
              obj.payload = JSON.parse(row.payload)
          }
            res(obj)
        })
      }
      catch (e) {
        rej(e)
      }
    })
  }

  this.getPendingRequests = () => {
    return new Promise((res, rej) => {
      try {
        db.all(`SELECT * FROM ${this.table} WHERE status = ${RequestQueueService.STATUS_PENDING} ORDER BY date DESC`, (err, rows) => {
          if (err)
            rej(err)
          res(rows)
        })
      }
      catch (e) {
        rej(e)
      }
    })
  }

  this.getDoneRequests = () => {
    return new Promise((res, rej) => {
      try {
        db.all(`SELECT * FROM ${this.table}  WHERE status = ${RequestQueueService.STATUS_DONE} order by date desc`, (err, rows) => {
          if (err)
            rej(err)
          res(rows)
        })
      }
      catch (e) {
        rej(e)
      }
    })
  }

  this.changeStatus = (id, status) => {
    return new Promise((res,rej) => {
      try {
        db.run(
            `UPDATE ${this.table} set status = ${status} WHERE id = ${id}`, function () {
              res(this.lastID)
            })
      }
      catch (e) {
        rej(e)
      }
    })
  }

  this.incrementRetryCounter = (id) => {
    return new Promise((res,rej) => {
      try {
        db.run(
            `UPDATE ${this.table} set retry_counter = retry_counter+1 WHERE id = ${id}`, function () {
              res(this.lastID)
            })
      }
      catch (e) {
        rej(e)
      }
    })
  }


  this.clearRequests = () => {
    return new Promise((res,rej) => {
      try {
        db.run(
            `DELETE FROM ${this.table}`, function () {
              res()
            })
      }
      catch (e) {
        rej(e)
      }
    })
  }

  this.getAllRequests = () => {
    return new Promise((res, rej) => {
      try {
        db.all(`SELECT * FROM ${this.table}`, (err, rows) => {
          if (err)
            rej(err)
          res(rows)
        })
      }
      catch (e) {
        rej(e)
      }
    })
  }
}

RequestQueueService.PRIORITY_MOST = 4
RequestQueueService.PRIORITY_HIGH = 3
RequestQueueService.PRIORITY_MEDIUM = 2
RequestQueueService.PRIORITY_LOW = 1
RequestQueueService.METHOD_POST = "POST"
RequestQueueService.METHOD_GET = "GET"
RequestQueueService.STATUS_PENDING = 0
RequestQueueService.STATUS_DONE = 1
RequestQueueService.STATUS_FAILED = 2
RequestQueueService.STATUS_NEVER = 3


module.exports = RequestQueueService;

/*
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
CREATE INDEX index_status ON queue (status);
*/
