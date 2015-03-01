#!/usr/bin/env node

var mongojs = require("mongojs");
var debug = require("debug")("test");
var async = require("async");
var path = require("path");

// load config
var config = require(path.resolve(__dirname, "../config.js"));

// load mongojs 
var db = mongojs(config.db, ["entities","relations","dataindex"]);

// local modules
var api = require(path.resolve(__dirname, "../lib/api.js"))(config.api, db);

var q = async.queue(function(fn, next){
	fn(next);
},10);

q.drain = function(){
	console.log("done");
	process.exit();
}

api.db.collection("entities").find({"importer": "parteispenden", "data.key": {"$in": ["names","surname"]}}, function(err, result){
	if (err) return;
	result.forEach(function(item){
		var _data = [];
		item.data.forEach(function(data){
			switch (data.key) {
				case "names":
					data.key = "surname";
					data.desc = "Nachname";
					data.updated = (new Date());
				break;
				case "surname":
					data.key = "names";
					data.desc = "Vornamen";
					data.updated = (new Date());
				break;
			} 
			_data.push(data);
		});
		item.data = _data;
		q.push(function(next){
			api.ent_update(item._id.toString(), item, function(err){
				next();
			});
		});
	});
});