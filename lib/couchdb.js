var host = process.env.COUCHDB_URL?process.env.COUCHDB_URL:"http://localhost:5984",
    nano = require('nano')(host),
    async = require('async');

// check to see if view "id" has contains "content"; if not replace it
var checkView = function (database_name, id, content, callback) {
  var rev = null;
  var db = nano.db.use(database_name);
  // fetch the view
  db.get(id, function (err, data) {

    // if there's no existing data
    if (!data) {
      data = {};
      rev = null;
    } else {
      rev = data._rev;
      delete data._rev;
    }

    // if comparison  of stringified versions are different
    if (JSON.stringify(data) !== JSON.stringify(content)) {
      if (rev) {
        content._rev = rev;
      }

      // update the saved version
      db.insert(content, function (err, data) {
        callback(null, true);
      });
    } else {
      callback(null, false);
    }

  });
};

// create any required views
var createViews = function (database_name, views, callback) {
  var  tasks = [];
  for(var i in views) {
    (function(dbname, id, v) {
      tasks.push(function(callback){
        checkView(dbname, id, v, function (err, data) {
          callback(err, data);
        });
      });
    }(database_name, views[i]._id, views[i]));
  };
  async.parallel(tasks, function (err, results) {
    callback(err, results);
  });
};

var createDatabase = function(db_name, callback) {
  nano.db.create(db_name, function(err, data) {
    if(!err || err.status_code==412) {
      callback(null, { ok: true});
    } else {
      callback(err, null);
    }
  });
};

module.exports = {
  createDatabase: createDatabase,
  createViews: createViews,
  nano: nano
}

