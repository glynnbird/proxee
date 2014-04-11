var http = require('http'),
    url = require('url'),
    querystring = require('querystring'),
    request = require('request'),
    _ = require('underscore'),
    apicalls = require('./lib/apicalls.js'),
    customers = require('./lib/customers.js');
    
// our proxy server
var server = http.createServer(function(req, res) {
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
  console.log(api_key);
  
  // check to see if the method/url combo is balid
  customers.get(api_key, function(err, customer) {
    
    if (err) {
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
        res.write(err);
        return res.end();
      } else {

        // calculate the remote request details
        var options = {
          url: "http://"+data.remote_host+":" + data.remote_port + data.remote_path,
          method: req.method
        };
        if (req.method == 'GET') {

          options.url += parsed_url.search;
        }
      
        // proxy the request, effectively connecting the incoming stream with the connection to remote path
        req.pipe(request(options)).pipe(res);
      }
    });


  });
  
  

  
}).listen(5001);    
    
