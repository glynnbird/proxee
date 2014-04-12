var _ = require('underscore'),
  moment = require('moment'),
  couchdb = require('./couchdb.js'),
  DB = "customers",
  customers_db = couchdb.nano.db.use(DB),
  CACHE_WINDOW = 60*2, // 2 minutes
  customers = {}; // local cache

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
  couchdb.createViews(DB, views, function(err, data) {
  });
});

var add = function(api_key, customer) {
  customer._ts = moment().add('s',CACHE_WINDOW).unix();
  customers[api_key] = customer;
}

var get = function(api_key, callback) {
  var now = moment().unix();
  if (!_.isUndefined(customers[api_key]) && customers[api_key]._ts > now) {
    callback(null, customers[api_key]);
  } else {
    customers_db.view('fetch', 'by_api_key', { key: api_key, include_docs: true}, function(err, data) {
      if (data.rows.length > 0) {
        var customer = data.rows[0].doc;
        add(api_key, customer);
        callback(null, customer);
      } else {
        callback(true, null);
      }
    })
  }
};

module.exports = {
  get: get
}
