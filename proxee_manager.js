var express = require('express'),
  _ = require('underscore'),
  bodyParser = require('body-parser'),
  customers = require('./lib/customers.js'),
  apicalls = require('./lib/apicalls.js'),
  usagelogs = require('./lib/usagelogs.js'),
  app = express(),
  port = (process.env.PROXEE_MANAGER_PORT)?process.env.PROXEE_MANAGER_PORT:5002;

// force express to parse posted and putted parameters
app.use(bodyParser());

// validate if 'params' are present in the incoming query string
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

// return a 404 JSON response
var ret404 = function(res, msg, data) {
  res.send(404, { success: false, message: msg, data: data})
}

// return a 200 JSON response
var ret200 = function(res, msg, data) {
  res.send(200, { success: true, message: msg, data: data})
}

// handle PUT /customer
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

// handle POST /customer/api_key
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

// handle DELETE /customer/api_key
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

// handle PUT /customer/apicall
app.put('/customer/apicall', function(req, res) {
  var p = ["customer_id","method","path","remote_url"];
  if (!checkParams(p, req.body)) {
    return ret404(res, "Missing mandatory params", p.toString());
  }
  var method = req.body.method.toUpperCase();
  var methods = ["GET", "PUT", "POST", "DELETE"];
  if (methods.indexOf(method) == -1) {
    return ret404(res, "Invalid method", method);
  }
  customers.get(req.body.customer_id, function(err, data) {
    if (err) {
      ret404(res, "Failed to add apicall. Customer does not exist", err.description);
    } else {
      apicalls.save(req.body.customer_id, req.body.method, req.body.path, req.body.remote_url, function(err, data) {
        if (err) {
          ret404(res, "Failed to write api_call", err.description);
        } else {
          ret200(res, "ok", data);
        }
      });
    }
  })
});

// handle DELETE /customer/apicall
app.delete('/customer/apicall', function(req, res) {
  var p = ["customer_id","method","path"];
  if (!checkParams(p, req.body)) {
    return ret404(res, "Missing mandatory params", p.toString());
  }
  var method = req.body.method.toUpperCase();
  var methods = ["GET", "PUT", "POST", "GET"];
  if (methods.indexOf(method) == -1) {
    return ret404(res, "Invalid method", method);
  }
  customers.get(req.body.customer_id, function(err, data) {
    if (err) {
      ret404(res, "Failed to remove apicall. Customer does not exist", err.description);
    } else {
      apicalls.remove(req.body.customer_id, req.body.method, req.body.path, function(err, data) {
        if (err) {
          ret404(res, "Failed to remove api_call", err.description);
        } else {
          ret200(res, "ok", data);
        }
      });
    }
  })
});

// handle GET /customer/stats/today
app.get("/customer/stats/today", function(req,res) {
  var p = ["customer_id"];
  if (!checkParams(p, req.query)) {
    return ret404(res, "Missing mandatory params", p.toString());
  }
  
  usagelogs.statsToday(req.query.customer_id, function(err, data) {
    if (err) {
      ret404(res, "Failed to fetch stats", null);
    } else {
      ret200(res, "ok", data);
    }
  })
});

// handle GET /customer/stats/thismonth
app.get("/customer/stats/thismonth", function(req,res) {
  var p = ["customer_id"];
  if (!checkParams(p, req.query)) {
    return ret404(res, "Missing mandatory params", p.toString());
  }
  
  usagelogs.statsThisMonth(req.query.customer_id, function(err, data) {
    if (err) {
      ret404(res, "Failed to fetch stats", null);
    } else {
      ret200(res, "ok", data);
    }
  })
});

// listen
app.listen(port);
console.log("Proxee Manager listening on port", port)