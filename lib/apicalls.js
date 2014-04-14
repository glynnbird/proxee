var apicalls = { },
 crypto = require('crypto'),
 moment = require('moment'),
 couchdb = require('./couchdb.js'),
 DB = "apicalls",
 apicalls_db = couchdb.nano.db.use(DB),
 CACHE_WINDOW = 60*60*24, // 24 hours
 calls = [];
 
// create the database
couchdb.createDatabase(DB, function(err, data) {
  console.log("Created database", DB);
});

var getHash = function(customer_id, method, path) {
  var str = customer_id + "|" + method.toUpperCase() + "|" + path;
  return crypto.createHash('md5').update(str).digest('hex');
}

var add = function(call) {
  var hash = getHash(call.customer_id, call.method, call.path);
  call._ts = moment().add('s',CACHE_WINDOW).unix();
  apicalls[hash] = call;
}

var get = function(customer_id, method, path, callback) {
  var now = moment().unix();
  var hash = getHash(customer_id, method, path);
  if (apicalls[hash] && apicalls[hash]._ts > now) {
    callback(null,apicalls[hash]);
  } else {
    delete apicalls[hash];
    apicalls_db.get(hash, function(err, data) {
      if (!err && data) {
        add(data);
        callback(null, data);
      } else {
        callback(true, null);
      }
    })

  }
};

var save = function(customer_id, method, path, remote_url, callback) {
  var hash = getHash(customer_id, method, path);
  var apicall = {
    "_id": hash,
    customer_id: customer_id,
    method: method.toUpperCase(),
    path: path,
    remote_url: remote_url
  };
  apicalls_db.insert(apicall, function(err, data) {
    callback(err, data);
  })
};

var remove = function(customer_id, method, path, callback) {
  var hash = getHash(customer_id, method, path);
  apicalls_db.get(hash, function(err, data) {
    if (err) {
      callback(err, data);
    } else {
      apicalls_db.destroy(data._id, data._rev, function(err, data) {
        callback(err, data);
      })
    }
  });
};

// follow real-time changes, removing cached values for any changed records
var feed = apicalls_db.follow({since: "now"});
feed.on('change', function (change) {
  delete apicalls[change.id]
});
feed.follow();

module.exports = {
  get: get,
  save: save,
  remove: remove
}

