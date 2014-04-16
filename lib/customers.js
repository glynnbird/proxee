var _ = require('underscore'),
  moment = require('moment'),
  couchdb = require('./couchdb.js'),
  DB = "customers",
  customers_db = couchdb.nano.db.use(DB),
  CACHE_WINDOW = 60*60*24, // 24 hours
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
 
// create the database and design docs
couchdb.createDatabase(DB, function(err, data) {
  console.log("Created database", DB);
  couchdb.createViews(DB, views, function(err, data) {
  });
});

// add api_key->customer to our in-memory cache
var add = function(api_key, customer) {
  customer._ts = moment().utc().add('s',CACHE_WINDOW).unix();
  customers[api_key] = customer;
}

// fetch a customer by api_key
var getByAPIKey = function(api_key, callback) {
  var now = moment().unix();
  
  // if the customer is in our cache
  if (!_.isUndefined(customers[api_key]) && customers[api_key]._ts > now) {
    // return it
    callback(null, customers[api_key]);
  } else {
    // fetch the customer from a CouchDB view
    delete customers[api_key];
    customers_db.view('fetch', 'by_api_key', { key: api_key, include_docs: true}, function(err, data) {
      if (data.rows.length > 0) {
        // store the customer in the cache
        var customer = data.rows[0].doc;
        add(api_key, customer);
        
        // return it
        callback(null, customer);
      } else {
        callback(true, null);
      }
    })
  }
};


// save a new customer in the database
var save = function(customer_id, name, api_key, callback) {
  
  // construct an object
  var customer = {
    "_id": customer_id,
    name: name,
    active: true,
    date_added: moment().utc().format("YYYY-MM-DD HH:mm:ss Z"),
    api_keys: [api_key]
  };
  
  // save it in CouchDB
  customers_db.insert(customer, function(err, data) {
    callback(err, data);
  })
};

// fetch a customer from the database
var get = function (customer_id, callback) {
  customers_db.get(customer_id, function(err, data) {
     callback(err, data);
  });
};

// add an API key to an existing customer
var addAPIKey = function(customer_id, api_key, callback) {
  
  // fetch the customer
  customers_db.get(customer_id, function(err, data) {
    if (err) {
      return callback(err, data);
    }
    
    // add the new API key
    data.api_keys.push(api_key);
    
    // save it
    customers_db.insert(data, function(err, data) {
      callback(err, data);
    })
  })
};

// delete an api key from an existing customer
var deleteAPIKey = function(customer_id, api_key, callback) {
  
  // load the customer
  customers_db.get(customer_id, function(err, data) {
    if (err) {
      return callback(err, data);
    }
    
    // remove the key
    var found = false;
    for( var i in data.api_keys) {
      if (data.api_keys[i] == api_key) {
        data.api_keys.splice(1,i);
        found = true;
        break;
      }
    }
    if (found) {
      
      // write the customer back
      customers_db.insert(data, function(err, data) {
        callback(err, data);
      });
    } else {
      callback({ "description": "api_key does not exist"}, null);
    }

  })
};

// follow real-time changes, removing cached values for any changed records
var feed = customers_db.follow({since: "now"});
feed.on('change', function (change) {
  for(var i in customers) {
    if (customers[i]._id = change.id) {
      delete customers[i];
    }
  }
});
feed.follow();

module.exports = {
  getByAPIKey: getByAPIKey,
  get: get,
  save: save,
  addAPIKey: addAPIKey,
  deleteAPIKey: deleteAPIKey
}
