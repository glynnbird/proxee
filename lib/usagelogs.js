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
    if(typeof doc.datetime != 'undefined') {
      var date = doc.datetime.split(" ")[0];
      var bits = date.split("-");
      var year = parseInt(bits[0],10);
      var month = parseInt(bits[1],10);
      var day = parseInt(bits[2],10);
      emit([doc.customer_id, year, month, day, doc.method, doc.path], 1);
    }
  };
  
  var views =   [
      {
          "_id": "_design/stats",
          "language": "javascript",
          "views": {
              "by_date_and_call": {
                  "map": map.toString(),
                  "reduce": "_count"
              }
          }
      }
  ];
  /* ******************************************************************* */
 
// create the database
couchdb.createDatabase(DB, function(err, data) {
  console.log("Created database", DB);
  couchdb.createViews(DB, views, function(err, data) {
  });
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

var statsToday = function(customer_id, callback) {

  //  _design/stats/_view/by_date_and_call?startkey=["frank",2014,4,14]&endkey=["frank",2014,4,14,"z"]&group_level=6
  var m = moment().utc();
  var year = m.year();
  var month = m.month() + 1;
  var day = m.date();
  var options = {
    startkey: [customer_id, year, month, day],
    endkey: [customer_id, year, month, day, "z"],
    group_level: 6
  };
  usagelogs_db.view("stats","by_date_and_call", options, function(err, data) {
    var retval = {};
    for(var i in data.rows) {
      retval[data.rows[i].key[4] + " " + data.rows[i].key[5]] = data.rows[i].value;
    }
    callback(err, retval); 
  });
}

module.exports = {
  log: log,
  flushBuffer: flushBuffer,
  statsToday: statsToday
};