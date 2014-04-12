var apicalls = { },
 crypto = require('crypto'),
 moment = require('moment'),
 couchdb = require('./couchdb.js');
 DB = "apicalls",
 apicalls_db = couchdb.nano.db.use(DB),
 CACHE_WINDOW = 60*2, // 2 minutes
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

module.exports = {
  get: get
}

