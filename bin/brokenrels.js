#!/usr/bin/env node

var mongojs = require("mongojs");
var debug = require("debug")("test");
var async = require("async");
var path = require("path");
var fs = require("fs");

var fix = JSON.parse(fs.readFileSync(path.resolve(__dirname, "brokenrels.json")));

// rework replacements

// load config
var config = require(path.resolve(__dirname, "../config.js"));

// load mongojs 
var db = mongojs(config.db, ["entities","relations","dataindex"]);

// local modules
var api = require(path.resolve(__dirname, "../lib/api.js"))(config.api, db);

Object.keys(fix).forEach(function(id){
	if (fix[id] !== null && fix[id] !== false) {
		api.rel_replace(id, fix[id], function(err){
			if (err) return console.log(err);
			console.log("replaced: "+id+" - "+fix[id]);
		});
	};
});