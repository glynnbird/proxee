var _ = require('underscore'),
  moment = require('moment');

var customers = {
  "123":   { 
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
    callback(true, nulll);
  }
};

module.exports = {
  get: get
}
