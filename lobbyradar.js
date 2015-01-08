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
app.set("views", path.resolve(__dirname, "assets/views"));

// static assets
app.use("/assets", express.static(path.resolve(__dirname, "assets")));
// static backend
app.use("/station", express.static(path.resolve(__dirname, "station")));

// parse application/json
app.use(bodyparser.json());

// use bodyparser for urlencoded forms
app.use(bodyparser.urlencoded({
	extended: false
}));

// check api key for api
app.use("/api", function(req, res, next){
	debug("request to api");
	var apikey = req.body.apikey || req.query.apikey || null;
	if (!apikey) return res.status(403).json({error: new Error("Access Denied. Please provide a valid API Key (#1)").toString()});
	if (!config.api.keys.hasOwnProperty(apikey)) return res.status(403).json({error: new Error("Access Denied. Please provide a valid API Key (#2)").toString()});
	debug("api access by %s", config.api.keys[apikey]);
	next();
});

// create entity. 
app.post("/api/entity/create", function(req, res){
	debug("create entity for \"%s\"", req.body.ent.name);
	api.ent_create(req.body.ent, function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// get entity. 
app.all("/api/entity/get/:id", function(req, res){
	debug("get entity %s", req.params.id);
	api.ent_get(req.params.id, function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// get entities.
app.get("/api/entity/list", function(req, res){
	debug("list entities");
	api.ent_list(req.query, function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// delete entity. 
app.all("/api/entity/delete/:id", function(req, res){
	debug("delete entity %s", req.params.id);
	api.ent_delete(req.params.id, function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// update entity. 
app.post("/api/entity/update/:id", function(req, res){
	debug("update entity %s", req.params.id);
	api.ent_update(req.params.id, req.body.ent, function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// upmerge entity. 
app.post("/api/entity/upmerge/:id", function(req, res){
	debug("upmerge entity %s", req.params.id);
	api.ent_upmerge(req.params.id, req.body.ent, function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// entity types. 
app.all("/api/entity/types", function(req, res){
	debug("entity types");
	api.ent_types(function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// entity tags.
app.all("/api/entity/tags", function(req, res){
	debug("entity tags");
	api.ent_tags(function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// export.
app.all("/api/entity/export", function(req, res){
	debug("relation tags");
	api.ent_export(function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// create relation. 
app.post("/api/relation/create", function(req, res){
	debug("create relation for \"%s\"", req.body.rel.name);
	api.rel_create(req.body.rel, function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// get relation. 
app.all("/api/relation/get/:id", function(req, res){
	debug("get relation %s", req.params.id);
	api.rel_get(req.params.id, function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// delete relation. 
app.all("/api/relation/delete/:id", function(req, res){
	debug("delete relation %s", req.params.id);
	api.rel_delete(req.params.id, function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// update relation. 
app.post("/api/relation/update/:id", function(req, res){
	debug("update relation %s", req.params.id);
	api.rel_update(req.params.id, req.body.rel, function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// upmerge relation. 
app.post("/api/relation/upmerge/:id", function(req, res){
	debug("upmerge relation %s", req.params.id);
	api.rel_upmerge(req.params.id, req.body.rel, function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// relation types. 
app.all("/api/relation/types", function(req, res){
	debug("relation types");
	api.rel_types(function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// relation tags.
app.all("/api/relation/tags", function(req, res){
	debug("relation tags");
	api.rel_tags(function(err, result){
		res.type("json").status("200").json({error: err, result: result});
	});
});

// default api method. 
app.all("/api", function(req, res){
	res.type("json").status("200").json({error:null});
});

// index page
app.all("/entity/:id", function(req, res){
	api.ent_get(req.params.id, function(err, ent){
		api.ent_rels(ent._id, function(err, rels){
			console.log(rels);
			ent.relations = rels;
			res.render("entity", {
				"err": err,
				"entity": ent
			});
		});
	});
});

// listing page
app.all("/list/:type/:letter?", function(req, res){
	var cond = {};

	if (req.params.hasOwnProperty("letter") && /^[a-z0-9]$/i.test(req.params.letter)) cond.letter = req.params.letter;
	if (req.params.hasOwnProperty("type") && ["person","organisation","entity"].indexOf(req.params.type) >= 0) cond.type = req.params.type;

	api.ent_list(cond, function(err, list){
		list = list.map(function(item){
			switch (item.type) {
				case "person": item.icon = "user"; break;
				case "organisation": item.icon = "building"; break;
				case "entity": item.icon = "building"; break;
			};
			return item;
		});
		var tmpl = {"list": { "type": (cond.type||"all"), "err": err, "item": list }};
		if (cond.letter) tmpl["letter_"+cond.letter] = true;
		if (cond.type) {
			tmpl["nav_"+cond.type] = true;
			tmpl["hl_"+cond.type] = true;
		} else {
			tmpl["hl_all"] = true;
		};
		res.render("index", tmpl);
	});
});


// index page
app.all("/", function(req, res){
	api.ent_list(function(err, list){
		res.render("index", {
			"list": {
				"err": err,
				"item": list
			}
		});
	});
});

// everything else is 404
app.all("*", function(req, res){
	res.status(404).send("404");
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
		debug("cleaned up old socket %s", path.basename(sockfile));
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
