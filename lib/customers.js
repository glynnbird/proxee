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
  console.log("Created database", DB);
  couchdb.createViews(DB, views, function(err, data) {
  });
});

var add = function(api_key, customer) {
  customer._ts = moment().add('s',CACHE_WINDOW).unix();
  customers[api_key] = customer;
}

var getByAPIKey = function(api_key, callback) {
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

var save = function(customer_id, name, api_key, callback) {
  var customer = {
    "_id": customer_id,
    name: name,
    active: true,
    date_added: moment().utc().format("YYYY-MM-DD HH:mm:ss Z"),
    api_keys: [api_key]
  };
  customers_db.insert(customer, function(err, data) {
    callback(err, data);
  })
};


var get = function (customer_id, callback) {
  customers_db.get(customer_id, function(err, data) {
     callback(err, data);
  });
};

var addAPIKey = function(customer_id, api_key, callback) {
  customers_db.get(customer_id, function(err, data) {
    if (err) {
      return callback(err, data);
    }
    data.api_keys.push(api_key);
    customers_db.insert(data, function(err, data) {
      callback(err, data);
    })
  })
};

var deleteAPIKey = function(customer_id, api_key, callback) {
  customers_db.get(customer_id, function(err, data) {
    if (err) {
      return callback(err, data);
    }
    var found = false;
    for( var i in data.api_keys) {
      if (data.api_keys[i] == api_key) {
        data.api_keys.splice(1,i);
        found = true;
        break;
      }
    }
    if (found) {
      customers_db.insert(data, function(err, data) {
        callback(err, data);
      });
    } else {
      callback({ "description": "api_key does not exist"}, null);
    }

  })
};

module.exports = {
  getByAPIKey: getByAPIKey,
  get: get,
  save: save,
  addAPIKey: addAPIKey,
  deleteAPIKey: deleteAPIKey
}
