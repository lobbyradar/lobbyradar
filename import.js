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
debug("resetting all data");
api.reset("i know what i am doing", function(){
	// run parteien importer
	debug("importing parteien");
	importer.parteien(function(){
		// run lobbyliste importer
		debug("importing lobbyliste");
		importer.lobbyliste(function(){
			// run thinktank importer
			debug("importing thinktanks");
			importer.thinktank(function(){
				// run seitenwechsler importer
				debug("importing seitenwechsler");
				importer.seitenwechsler(function(){
					// run parteispenden importer
					debug("importing parteispenden");
					importer.parteispenden(function(){
						// run dax importer
						debug("importing dax");
						importer.dax(function(){
							// done
							debug("done");
							process.exit();
						});
					});
				});
			});
		});
	});
});
