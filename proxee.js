var http = require('http'),
    https = require('https'),
    url = require('url'),
    fs = require('fs'),
    querystring = require('querystring'),
    request = require('request'),
    _ = require('underscore'),
    apicalls = require('./lib/apicalls.js'),
    customers = require('./lib/customers.js'),
    usagelogs = require('./lib/usagelogs.js'),
    http_port = (process.env.PROXEE_HTTP_PORT)?process.env.PROXEE_HTTP_PORT:5001,
    https_port = (process.env.PROXEE_HTTPS_PORT)?process.env.PROXEE_HTTPS_PORT:5003,
    customer_id_field = (process.env.PROXEE_CUSTOMER_ID_FIELD)?process.env.PROXEE_CUSTOMER_ID_FIELD:null,
    https_key_path = (process.env.PROXEE_HTTPS_KEY_PATH)?process.env.PROXEE_HTTPS_KEY_PATH:null,
    https_cert_path = (process.env.PROXEE_HTTPS_CERT_PATH)?process.env.PROXEE_HTTPS_CERT_PATH:null;
    
// handle a request
// - req - the request
// - res - the response    
var handle = function (req, res) {
  console.log(req.method, req.url);
  
  // find the api_key
  var parsed_url = url.parse(req.url);
  var parsed_qs = querystring.parse(parsed_url.query);
  var api_key = parsed_qs.api_key;
  if (_.isUndefined(api_key)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.write("Must supply ?api_key=<your api key>");
    return res.end();
  }
  
  // check to see if the method/url combo is balid
  customers.getByAPIKey(api_key, function(err, customer) {
    
    if (err ||  customer.active == false) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.write("Your api_key is not valid");
      return res.end();
    }
    
    // see if this is a valid API call for this customer
    var path = parsed_url.pathname
    var call = apicalls.get(customer._id, req.method, path, function(err, data) {
    
      if (err) {
        // if the api call does not exist, return 404
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.write("apicall is invalid");
        return res.end();
      } else {

        // calculate the remote request details
        var options = {
          url: data.remote_url,
          method: req.method
        };
        
        // add GET parameters into the url
        if (req.method == 'GET') {
          options.url += parsed_url.search;
        }
        
        // if the customer_id is to be forced into the url
        if (customer_id_field) {
          var parsed = url.parse(options.url);
          if (parsed.search) {
            options.url += "&"
          } else {
            options.url += "?";
          }
          options.url += customer_id_field + "=" + escape(customer._id);
        }
      
        // proxy the request, effectively connecting the incoming stream with the connection to remote path
        req.pipe(request(options)).pipe(res);
        
        // record usage logs
        usagelogs.log(req.method, data.path, api_key, customer._id, function(err, data) {
          
        });
      }
    });

  });
}    
    
// it an https server is required
if (https_key_path && https_cert_path) {

  // load the key and certificate PEM files
  var options = {
    key: fs.readFileSync(https_key_path),
    cert: fs.readFileSync(https_cert_path)
  };

  // start up an https server
  https.createServer(options, function (req, res) {
    handle(req, res);
  }).listen(https_port);
  console.log("Proxee listening for HTTPS on port", https_port);      
}    
    
    
// start up an http server
var server = http.createServer(function(req, res) {
  handle(req, res);
}).listen(http_port);
console.log("Proxee listening for HTTP on port", http_port);    

// ensure buffers are flushed on exit
var gracefulExit = function () { 
  usagelogs.flushBuffer(true, function(err, data) {
      process.exit();
  });
} 

// detect script being killed
process
 .on('SIGINT', gracefulExit)
 .on('SIGTERM', gracefulExit) 
 
