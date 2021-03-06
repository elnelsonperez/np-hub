const Database = require("./../core/Database")
const dateFormat =require('dateformat')
/**
 * Este servicio tiene la responsabilidad de realizar cualquier operacion en la
 * base de datos que tenga que ver con las solicitues HTTP.
 * @constructor
 */
const RequestQueueService = function () {
  this.table = "queue"
  const db = Database.conn

  /**
   * Agrega una solicitud a la cola de requests.
   * @param url
   * @param method POST o GET
   * @param payload Data enviar
   * @param priority prioridad
   * @param event_name Nombre del evento que se va a disparar cuando el request se complete
   * @param auto_discard Marcar request como auto-descartable. (Lo utiliza el RequestProcessorService)
   * @param date
   * @return {Promise<any>}
   */
  this.addRequest = (
      {url, method, payload = {}, priority = RequestQueueService.PRIORITY_LOW, event_name = null,
        auto_discard = false, date = null}
  ) => {
    return new Promise((res,rej) => {
      try {
        let dateToInsert = dateFormat( new Date(), "yyyy-mm-dd HH:MM:ss")
        if (date !== null) {
          dateToInsert = date
        }

        const stmt = db.prepare(
            `INSERT INTO ${this.table}(url,method,payload,priority,event_name,auto_discard,date) 
            VALUES (?,?,?,?,?,?,?)`, [url,method,JSON.stringify(payload),priority,event_name, auto_discard === true ? 1 : 0,dateToInsert])
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

  this.removeFromQueue = (ids) => {
    return new Promise((res,rej) => {
      try {
        db.run(
            `DELETE FROM ${this.table} 
            WHERE id in (${ids.join(',')})`, function () {
              res()
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
        ORDER BY date ASC`, (err, row) => {
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

  this.getPendingRequestsByEventName = (name) => {
    return new Promise((res, rej) => {
      try {
        db.all(`
        SELECT * FROM ${this.table} 
        WHERE status = ${RequestQueueService.STATUS_PENDING}
        AND event_name = '${name}' ORDER BY date ASC
        `, (err, rows) => {
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

  this.clearRequestsByEventName = (ename) => {
    return new Promise((res,rej) => {
      try {
        db.run(
            `DELETE FROM ${this.table} where event_name = '${ename}'`, function () {
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
