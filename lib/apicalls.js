var apicalls = { },
 crypto = require('crypto'),
 moment = require('moment');

var calls = [
  { 
    customer_id: "123",
    method: "get",
    path: "/v1/entity",
    remote_path: "http://wolf.centralindex.com/entity"
  },
  { 
    customer_id: "123",
    method: "get",
    path: "/entity/search/what/where",
    remote_path: "http://wolf.centralindex.com/entity/search/what/where"
  },
  { 
    customer_id: "123",
    method: "get",
    path: "/publisher",
    remote_path: "http://wolf.centralindex.com/publisher"
  }
];

var getHash = function(customer_id, method, path) {
  var str = customer_id + "|" + method.toLowerCase() + "|" + path;
  return crypto.createHash('md5').update(str).digest('hex');
}

var add = function(call) {
  var hash = getHash(call.customer_id, call.method, call.path);
  call._ts = moment().unix();
  apicalls[hash] = call;
}

var get = function(customer_id, method, path, callback) {
  console.log(customer_id, method, path);
  var hash = getHash(customer_id, method, path);
  if (apicalls[hash]) {
    callback(null,apicalls[hash]);
  } else {
    callback("No such API call",null);
  }
};

module.exports = {
  get: get
}

for (var i in calls) {
  add(calls[i]);
}
console.log(apicalls);