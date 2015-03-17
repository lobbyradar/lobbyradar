#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var debug = require("debug")("relgraph");
var mongojs = require("mongojs");

// load config
var config = require(path.resolve(__dirname, "../config.js"));

// load mongojs 
var db = mongojs(config.db, ["entities","relations"]);

// local modules
var api = require(path.resolve(__dirname, "../lib/api.js"))(config.api, db);

api.relgraph(function(err, graph){
	debug("retrieved %d edges", graph.length);
	fs.writeFileSync(path.resolve(__dirname, "../assets/cache/relgraph.json"), JSON.stringify(graph,null,"\t"));
	process.exit();
});