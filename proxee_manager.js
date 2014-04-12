var express = require('express'),
  _ = require('underscore'),
  bodyParser = require('body-parser'),
  customers = require('./lib/customers.js'),
  app = express();

// force express to parse posted and putted parameters
app.use(bodyParser());

var checkParams = function(params, qs) {
  var ok = true;
  for( var i in params) {
    if (_.isUndefined(qs[params[i]]) || qs[params[i]].length ==0) {
      ok = false;
      break;
    }
  }
  return ok;
}

var ret404 = function(res, msg, data) {
  res.send(404, { success: false, message: msg, data: data})
}

var ret200 = function(res, msg, data) {
  res.send(200, { success: true, message: msg, data: data})
}

app.put('/customer', function(req, res) {
  var p = ["customer_id","name","api_key"];
  if (!checkParams(p, req.body)) {
    return ret404(res, "Missing mandatory params", p.toString());
  }
  customers.save(req.body.customer_id, req.body.name, req.body.api_key, function(err, data) {
    if (err) {
      ret404(res, "Failed to write customer", err.description);
    } else {
      ret200(res, "ok", data);
    }
  });

});

app.post('/customer/api_key', function(req, res) {
  var p = ["customer_id", "api_key"];
  if (!checkParams(p, req.body)) {
    return ret404(res, "Missing mandatory params", p.toString());
  }
  customers.addAPIKey(req.body.customer_id, req.body.api_key, function(err, data) {
    if (err) {
      ret404(res, "Failed to write api_key", err.description);
    } else {
      ret200(res, "ok", data);
    }
  });
});

app.delete('/customer/api_key', function(req, res) {
  var p = ["customer_id", "api_key"];
  if (!checkParams(p, req.body)) {
    return ret404(res, "Missing mandatory params", p.toString());
  }
  customers.deleteAPIKey(req.body.customer_id, req.body.api_key, function(err, data) {
    if (err) {
      ret404(res, "Failed to remove api_key", err.description);
    } else {
      ret200(res, "ok", data);
    }
  });
});

app.listen(3000);