#!/usr/bin/env node

// node modules
var bodyparser = require("body-parser");
var mustache = require("mustache-express");
var express = require("express");
var mongojs = require("mongojs");
var moment = require("moment");
var crypto = require("crypto");
var debug = require("debug")("app");
var path = require("path");
var nsa = require("nsa");
var fs = require("fs");

// config
var config = require("./config.js");

// check config for listen directive
if (!config.hasOwnProperty("listen")) {
	coneole.error("you have to configure a socket or port");
	process.exit();
};

// load mongojs 
var db = mongojs(config.db, ["entities","relations"]);

// local modules
var api = require("./lib/api.js")(config.api, db);

// use nsa if configured
if (config.hasOwnProperty("nsa") && (config.nsa)) {
	var heartbeat = new nsa({
		server: config.nsa,
		service: "lobbyradar",
		interval: "10s"
	}).start(function(){
		debug("started heartbeat");
	});
};

// use express
var app = express();

// use mustache
var _mustache = mustache();
_mustache.cache = false;
app.engine("mustache", _mustache);
app.set("view engine", "mustache");
app.set("views", path.resolve(__dirname, "views"));

var webpath = path.resolve(__dirname, "web");
app.use("/", express.static(webpath));

// parse application/json
app.use(bodyparser.json());

// use bodyparser for urlencoded forms
app.use(bodyparser.urlencoded({
	extended: false
}));

// default api method. does nothing //OK//
app.get("/api", function(req, res){
	res.status("200").json({error:null});
});

// everything else is 404
app.get("*", function(req, res){
	res.status(404).send();
});

// determine listen method
if (config.listen.hasOwnProperty("host") && config.listen.hasOwnProperty("port")) {
	// listen on tcp
	app.listen(config.listen.port, config.listen.host, function(){
		debug("listening on %s:%d", config.listen.host, config.listen.port);
	});
} else if (config.listen.hasOwnProperty("port")) {
	// listen on tcp
	app.listen(config.listen.port, config.listen.host, function(){
		debug("listening on %s:%d", config.listen.host, config.listen.port);
	});
} else if (config.listen.hasOwnProperty("socket")) {
	// listen on socket
	var sockfile = path.resolve(config.listen.socket);
	fs.exists(sockfile, function(ex){
		var umask = process.umask(0000);
		(function(fn){
			// delete existing socket and start listening
			if (ex) return fs.unlink(sockfile, function(err){
				if (err) console.error(err) || process.exit();
				debug("cleaned up old socket %s", path.basename(sockfile));
				return fn();
			});
			fn();
		})(function(){
			app.listen(sockfile, function(){
				debug("listening on socket %s", path.basename(sockfile));
				process.umask(umask);
			});
		});
	});
} else {
	// listen to your heart
	coneole.error("you have to configure a socket or port");
	process.exit();
};

// delete socket before exiting on SIGINT
process.on("SIGINT", function(){
	if (sockfile) return fs.unlink(sockfile, function(err){
		if (err) return console.error("failed to clean up old socket", path.basename(sockfile), err);
		debug("cleaned up old socket %s", path.basename(config.sockfile));
		if (heartbeat) return heartbeat.end(function(){
			debug("ended heartbeat");
			process.exit();
		});
		process.exit();
	});
	if (heartbeat) return heartbeat.end(function(){
		debug("ended heartbeat");
		process.exit();
	});
	process.exit();
});
