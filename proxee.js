var http = require('http'),
    httpProxy = require('http-proxy'),
    apicalls = require('./lib/apicalls.js');
    
// the proxy
var proxy = httpProxy.createProxyServer({});

// our proxy server
var server = http.createServer(function(req, res) {
  console.log(req.method.toLowerCase(), req.url);
  
  // check to see if the method/url combo is balid
  var call = apicalls.get('123', req.method, req.url, function(err, data) {
    if (err) {
      // if the api call does not exist, return 404
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.write(err);
      res.end();
    } else {
      // if the api call does exist, proxy this request to the real url
      proxy.web(req, res, { target: data.remote_path })
    }
  });
  
}).listen(5001);    
    
// if the proxy encounters an error, return 500
proxy.on('error', function (err, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });
  res.end('Something went wrong. And we are reporting a custom error message.');
});    
