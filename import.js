#!/usr/bin/env node

var path = require("path");
var debug = require("debug")("importer");
var mongojs = require("mongojs");

// load config
var config = require(path.resolve(__dirname, "./config.js"));

// load mongojs 
var db = mongojs(config.db, ["entities","relations"]);

// local modules
var api = require(path.resolve(__dirname, "./lib/api.js"))(config.api, db);

// get importers
var importer = require("./importer");

// reset database
debug("resetting data");
api.reset("i know what i am doing", function(){
	// run lobbyliste importer
	debug("importing lobbyliste");
	importer.lobbyliste(function(){
		// run thinktank importer
		debug("importing thinktanks");
		importer.thinktank(function(){
			// done
			debug("done");
			process.exit();
		});
	});
});
