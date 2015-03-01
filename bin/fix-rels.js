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

api.db.collection("entities").find({}, {"_id": true}, function(err, result){
	if (err) return;
	var _rels = {};
	var _dels = [];
	result.forEach(function(rel){ _rels[rel._id.toString()] = true; });
	api.db.collection("relations").find({}, {"_id": true, "entities": true}, function(err, result){
		result.forEach(function(rel){
			if (rel.entities.length !== 2) return _dels.push(rel._id);
			if (!_rels.hasOwnProperty(rel.entities[0].toString()) || !_rels.hasOwnProperty(rel.entities[1].toString())) {
				console.log("delete rel: "+rel._id.toString(), rel.entities[0].toString(), rel.entities[1].toString());
				_dels.push(rel._id);
			}
		});
		console.log(_dels.length, "to delete");
		api.db.collection("relations").remove({_id: {"$in": _dels}}, function(err, res){
			if (err) return console.log(err);
			console.log(res.n, "deleted");
			process.exit();
		});
	});
});