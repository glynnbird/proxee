var _ = require('underscore'),
  moment = require('moment'),
  couchdb = require('./couchdb.js'),
  DB = "usagelogs",
  usagelogs_db = couchdb.nano.db.use(DB),
  BUFFER_SIZE = 10,
  buffer = [];
  
  /* ********************************************************************* */
  // COUCHDB view and design doc

  var map = function(doc) {
    if (typeof doc.api_keys != 'undefined') {
      for (var i in doc.api_keys) {
        emit(doc.api_keys[i], 1);
      }
    }
  };
  
  var views =   [
      {
          "_id": "_design/fetch",
          "language": "javascript",
          "views": {
              "by_api_key": {
                  "map": map.toString()
              }
          }
      }
  ];
  /* ******************************************************************* */
 
// create the database
couchdb.createDatabase(DB, function(err, data) {
  console.log("Created database", DB);
 /* couchdb.createViews(DB, views, function(err, data) {
  });*/
});

var flushBuffer = function(force, callback) {
  if (force || buffer.length >= BUFFER_SIZE) {
    var flushSize = (force) ? buffer.length: BUFFER_SIZE
    var towrite = buffer.splice(0, flushSize);
    usagelogs_db.bulk({docs: towrite}, function(err, data) {
      callback(err, data);
    });
  }
};

var log = function(method, path, api_key, customer_id, callback) {
  var now = moment().utc();
  var obj = {
    method: method,
    path: path,
    api_key: api_key,
    customer_id: customer_id,
    datetime: now.format("YYYY-MM-DD HH:mm:ss Z"),
    ts: now.unix()
  };
  buffer.push(obj);
  flushBuffer(false, function(err, data) {
    callback(err, data);
  })
};

module.exports = {
  log: log,
  flushBuffer: flushBuffer
};