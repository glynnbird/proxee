var _ = require('underscore'),
  moment = require('moment'),
  couchdb = require('./couchdb.js');
  
  /* ********************************************************************* */


  var map = function(doc) {
    
  }
 
  [
      {
          "_id": "_design/fetch",
          "language": "javascript",
          "views": {
              "by_key": {
                  "map": "function(doc) { emit([doc.cacheKey, doc.ts], doc.value); }"
              },
              "by_ts": {
                  "map": "function(doc) { emit(doc.ts, doc._rev); }"
              }
          }
      }
  ]
 
  // create the database
  couchdb.createDatabase(DB, function(err, data) {
    console.log("Created database",DB);
    couchdb.createViews(DB, views, function(err, data) {
    
    });
  });

var customers = {
  "mnjfaftrpzfy5a3wram77tpu":   { 
    _id: "123",
    name: "The name",
    active: true,
    date_added: "2014-12-01 12:22:11 +00:00"
  }
};

var getHash = function(customer_id, method, path) {

}

var add = function(call) {

}

var get = function(customer_id, callback) {
  
  if (!_.isUndefined(customers[customer_id])) {
    callback(null, customers[customer_id]);
  } else {
    callback(true, null);
  }
};

module.exports = {
  get: get
}
