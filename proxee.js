var http = require('http'),
    url = require('url'),
    request = require('request'),
    apicalls = require('./lib/apicalls.js'),
    customers = require('./lib/customers.js');
    
// our proxy server
var server = http.createServer(function(req, res) {
  console.log(req.method, req.url);
  
  // check to see if the method/url combo is balid
  customers.get('123', function(err,data) {
    //console.log(err,data);
  });
  
  var parsed_url =  url.parse(req.url);
  var path = parsed_url.pathname
  

  var call = apicalls.get('123', req.method, path, function(err, data) {
    
    if (err) {
      // if the api call does not exist, return 404
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.write(err);
      res.end();
    } else {

      // calculate the remote request details
      var options = {
        url: "http://"+data.remote_host+":" + data.remote_port + data.remote_path,
        method: req.method
      };
      if (req.method == 'GET') {
        var parsed_url = url.parse(req.url);
        options.url += parsed_url.search;
      }
      
      // proxy the request, effectively connecting the incoming stream with the connection to remote path
      req.pipe(request(options)).pipe(res);
    }
  });
  
}).listen(5001);    
    
