var assert = require('assert'),
  should = require('should');
  request = require('request'),
  express = require('express'),
  async = require('async');
  bodyParser = require('body-parser'),
  app = express(),
  port = 5050,
  couchdb = require('../lib/couchdb.js'),
  customer_id = "05c0ff909643d785550d9b71c8f910aa",
  customer_rev = null,
  api_key = "3518573939308e637f2ba5b6bdce1895",
  apicalls_to_delete = [];

// force express to parse posted and putted parameters
app.use(bodyParser());
  
describe('API', function(){ 

  before(function(done) {

    // create test API to proxy to
    app.put('/testput', function(req, res) {
      res.send(200, { success: true, data: req.body})
    });
    
    app.delete('/testdelete', function(req, res) {
      res.send(200, { success: true, data: req.body})
    });
    
    app.post('/testpost', function(req, res) {
      res.send(200, { success: true, data: req.body})
    });
    
    app.get('/testget', function(req, res) {
      res.send(200, { success: true, data: req.query})
    });
    
    app.listen(port);
    done();
    
  });
  
  it('should allow a customer to be created', function(done) {
     
    var options = {
      method: "put",
      uri: "http://localhost:5002/customer",
      form: {
        customer_id: customer_id,
        name: "Just Testing",
        api_key: api_key
      }
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.be.json;
      r.should.have.status(200);
      body = JSON.parse(body);
      body.should.have.property("success");
      body.success.should.be.a.Boolean;
      body.success.should.be.equal(true);
      body.should.have.property("data");
      body.data.should.be.an.Object;
      body.data.should.have.property("id");
      body.data.id.should.be.a.String;
      body.data.should.have.property("rev");
      customer_rev = body.data.rev;
      body.data.rev.should.be.a.String;
      done();      
    });

  });
  
  it('should not allow a customer to be recreated', function(done) {
     
    var options = {
      method: "put",
      uri: "http://localhost:5002/customer",
      form: {
        customer_id: customer_id,
        name: "Just Testing",
        api_key: api_key
      }
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.be.json;
      r.should.have.status(404);
      body = JSON.parse(body);
      body.should.have.property("success");
      body.success.should.be.a.Boolean;
      body.success.should.be.equal(false);
      done();      
    });

  });
  
  it('should allow an api_call to be added', function(done) {
     
    var options = {
      method: "put",
      uri: "http://localhost:5002/customer/apicall",
      form: {
        customer_id: customer_id,
        path: "/v1/testget",
        method: "get",
        remote_url: "http://localhost:5050/testget"
      }
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.be.json;
      r.should.have.status(200);
      body = JSON.parse(body);
      body.should.have.property("success");
      body.success.should.be.a.Boolean;
      body.success.should.be.equal(true);
      body.should.have.property("data");
      body.data.should.be.an.Object;
      body.data.should.have.property("id");
      body.data.id.should.be.a.String;
      body.data.should.have.property("rev");
      body.data.rev.should.be.a.String;
      var obj = { _id: body.data.id, _rev: body.data.rev };
      apicalls_to_delete.push(obj);
      done();      
    });

  });
  
  it('should allow an another api_key to be added', function(done) {
     
    var options = {
      method: "post",
      uri: "http://localhost:5002/customer/api_key",
      form: {
        customer_id: customer_id,
        api_key: api_key+"2"
      }
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.be.json;
      r.should.have.status(200);
      body = JSON.parse(body);
      body.should.have.property("success");
      body.success.should.be.a.Boolean;
      body.success.should.be.equal(true);
      body.should.have.property("data");
      body.data.should.be.an.Object;
      body.data.should.have.property("id");
      body.data.id.should.be.a.String;
      body.data.should.have.property("rev");
      body.data.rev.should.be.a.String;      
      customer_rev = body.data.rev;
      done();      
    });

  });
  
  
  it('should allow a POST call to be added', function(done) {
     
    var options = {
      method: "put",
      uri: "http://localhost:5002/customer/apicall",
      form: {
        customer_id: customer_id,
        path: "/v1/testpost",
        method: "post",
        remote_url: "http://localhost:5050/testpost"
      }
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.be.json;
      r.should.have.status(200);
      body = JSON.parse(body);
      body.should.have.property("success");
      body.success.should.be.a.Boolean;
      body.success.should.be.equal(true);
      body.should.have.property("data");
      body.data.should.be.an.Object;
      body.data.should.have.property("id");
      body.data.id.should.be.a.String;
      body.data.should.have.property("rev");
      body.data.rev.should.be.a.String;
      var obj = { _id: body.data.id, _rev: body.data.rev };
      apicalls_to_delete.push(obj);
      done();      
    });

  });
  
  it('should allow a DELETE call to be added', function(done) {
     
    var options = {
      method: "put",
      uri: "http://localhost:5002/customer/apicall",
      form: {
        customer_id: customer_id,
        path: "/v1/testdelete",
        method: "delete",
        remote_url: "http://localhost:5050/testdelete"
      }
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.be.json;
      r.should.have.status(200);
      body = JSON.parse(body);
      body.should.have.property("success");
      body.success.should.be.a.Boolean;
      body.success.should.be.equal(true);
      body.should.have.property("data");
      body.data.should.be.an.Object;
      body.data.should.have.property("id");
      body.data.id.should.be.a.String;
      body.data.should.have.property("rev");
      body.data.rev.should.be.a.String;
      var obj = { _id: body.data.id, _rev: body.data.rev };
      apicalls_to_delete.push(obj);
      done();      
    });

  });
  
  it('should allow a DELETE call to be added', function(done) {
     
    var options = {
      method: "put",
      uri: "http://localhost:5002/customer/apicall",
      form: {
        customer_id: customer_id,
        path: "/v1/testput",
        method: "put",
        remote_url: "http://localhost:5050/testput"
      }
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.be.json;
      r.should.have.status(200);
      body = JSON.parse(body);
      body.should.have.property("success");
      body.success.should.be.a.Boolean;
      body.success.should.be.equal(true);
      body.should.have.property("data");
      body.data.should.be.an.Object;
      body.data.should.have.property("id");
      body.data.id.should.be.a.String;
      body.data.should.have.property("rev");
      body.data.rev.should.be.a.String;
      var obj = { _id: body.data.id, _rev: body.data.rev };
      apicalls_to_delete.push(obj);
      done();      
    });

  });
  
  
  it('should allow yet another api_call to be added', function(done) {
     
    var options = {
      method: "put",
      uri: "http://localhost:5002/customer/apicall",
      form: {
        customer_id: customer_id,
        path: "/v1/disposable",
        method: "get",
        remote_url: "http://localhost:5050/disposable"
      }
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.be.json;
      r.should.have.status(200);
      body = JSON.parse(body);
      body.should.have.property("success");
      body.success.should.be.a.Boolean;
      body.success.should.be.equal(true);
      body.should.have.property("data");
      body.data.should.be.an.Object;
      body.data.should.have.property("id");
      body.data.id.should.be.a.String;
      body.data.should.have.property("rev");
      body.data.rev.should.be.a.String;
      done();      
    });

  });
  
  it('should allow an api_call to be remove', function(done) {
     
    var options = {
      method: "DELETE",
      uri: "http://localhost:5002/customer/apicall",
      form: {
        customer_id: customer_id,
        path: "/v1/disposable",
        method: "get"
      }
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.be.json;
      r.should.have.status(200);
      body = JSON.parse(body);
      body.should.have.property("success");
      body.success.should.be.a.Boolean;
      body.success.should.be.equal(true);
      body.should.have.property("data");
      body.data.should.be.an.Object;
      body.data.should.have.property("id");
      body.data.id.should.be.a.String;
      body.data.should.have.property("rev");
      body.data.rev.should.be.a.String;
      done();      
    });

  });
  
  it('should allow a get api call to be proxied', function(done) {
     
    var options = {
      method: "get",
      uri: "http://localhost:5001/v1/testget?api_key="+api_key+"&a=1&b=2&c=3"
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.be.json;
      r.should.have.status(200);
      body = JSON.parse(body);
      body.should.have.property("success");
      body.success.should.be.a.Boolean;
      body.success.should.be.equal(true);
      body.should.have.property("data");
      body.data.should.be.an.Object;
      for(var i in options.form) {
        body.data.should.have.property(i);
        body.data[i].should.be.a.String;
        body.data[i].should.be.equal(options.form[i]);
      }
      done();      
    });

  });
  
  it('should allow a post api call to be proxied', function(done) {
     
    var options = {
      method: "post",
      uri: "http://localhost:5001/v1/testpost?api_key="+api_key,
      form: {
        a:"1",
        b:"2",
        c:"3"
      }
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.be.json;
      r.should.have.status(200);
      body = JSON.parse(body);
      body.should.have.property("success");
      body.success.should.be.a.Boolean;
      body.success.should.be.equal(true);
      body.should.have.property("data");
      body.data.should.be.an.Object;
      for(var i in options.form) {
        body.data.should.have.property(i);
        body.data[i].should.be.a.String;
        body.data[i].should.be.equal(options.form[i]);
      }
      done();      
    });

  });
  
  it('should allow a delete api call to be proxied', function(done) {
     
    var options = {
      method: "delete",
      uri: "http://localhost:5001/v1/testdelete?api_key="+api_key,
      form: {
        a:"1",
        b:"2",
        c:"3"
      }
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.be.json;
      r.should.have.status(200);
      body = JSON.parse(body);
      body.should.have.property("success");
      body.success.should.be.a.Boolean;
      body.success.should.be.equal(true);
      body.should.have.property("data");
      body.data.should.be.an.Object;
      for(var i in options.form) {
        body.data.should.have.property(i);
        body.data[i].should.be.a.String;
        body.data[i].should.be.equal(options.form[i]);
      }
      done();      
    });

  });
  
  it('should allow a put api call to be proxied', function(done) {
     
    var options = {
      method: "put",
      uri: "http://localhost:5001/v1/testput?api_key="+api_key,
      form: {
        a:"1",
        b:"2",
        c:"3"
      }
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.be.json;
      r.should.have.status(200);
      body = JSON.parse(body);
      body.should.have.property("success");
      body.success.should.be.a.Boolean;
      body.success.should.be.equal(true);
      body.should.have.property("data");
      body.data.should.be.an.Object;
      for(var i in options.form) {
        body.data.should.have.property(i);
        body.data[i].should.be.a.String;
        body.data[i].should.be.equal(options.form[i]);
      }
      done();      
    });

  });
  
  it('should not allow an invalid api call to be proxied', function(done) {
     
    var options = {
      method: "put",
      uri: "http://localhost:5001/v1/invalidurl?api_key="+api_key,
      form: {
        a:"1",
        b:"2",
        c:"3"
      }
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.have.status(404);
      done();      
    });

  });
  
  it('should not allow in invalid api_key through', function(done) {
     
    var options = {
      method: "get",
      uri: "http://localhost:5001/v1/testget?api_key="+api_key+"invalid"+"&a=1&b=2&c=3"
    };
    request(options, function(e, r, body) {
      assert.equal(e, null);
      r.should.have.status(403);
      done();      
    });

  });
  
  after(function(done) {
    var customers = couchdb.nano.db.use('customers');
    var apicalls = couchdb.nano.db.use('apicalls');
    var tasks = [];
    
    tasks.push(function(callback) {
      customers.destroy(customer_id, customer_rev, function(err, data) {
        callback(null, null);
      });
    });
    
    for(var i in apicalls_to_delete) {
      (function(obj) {
         tasks.push(function(callback) {
           apicalls.destroy(obj._id, obj._rev, function(err, data) {
             callback(null, null);
           });
         });
      })(apicalls_to_delete[i]);
    }
    async.series( tasks, function(err, callback) {
       done(); 
    });

  });
});