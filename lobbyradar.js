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
var unq = require("unq");
var nsa = require("nsa");
var fs = require("fs");
var passportlocal = require("passport-local");
var passport = require("passport");
var cookieParser = require('cookie-parser');
var session = require('express-session');
var sessionstore = require('express-session-json')(session);

// config
var config = require("./config.js");

// check config for listen directive
if (!config.hasOwnProperty("listen")) {
	coneole.error("you have to configure a socket or port");
	process.exit();
}

// load mongojs 
var db = mongojs(config.db, ["entities", "relations", "users", "fields", "dataindex"]);

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

/* configure passport */
passport.serializeUser(function (user, done) {
	done(null, user._id);
});

passport.deserializeUser(function (id, done) {
	api.user_get(id, function (err, user) {
		if (err)
			done(null, false); //remove session (invalid username, e.g. after id change)
		else
			done(null, user);
	});
});

passport.use(new passportlocal.Strategy(function (username, password, done) {
	api.user_auth(username, password, function (err, user) {
		if ((err) || (!user)) {
			done(null, false, {message: 'Invalid Credentials'});
		} else {
			done(null, user);
		}
	});
}));

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

app.use(cookieParser('domo arigato mr roboto'));
app.use(session({
	secret: 'domo arigato mr roboto',
	resave: false,
	saveUninitialized: false,
	store: new sessionstore()
}));
app.use(passport.initialize());
app.use(passport.session());

// parse application/json
app.use(bodyparser.json({
	limit: '20mb'
}));

// use bodyparser for urlencoded forms
app.use(bodyparser.urlencoded({
	extended: false
}));

var nice_error = function(err){
	if (!err) return;
	return err.toString();
};

// check api key for api
app.use("/api", function (req, res, next) {
	debug("request to api");

	if (!(/^\/(users|fields)\//i.test(req.url)) && ["GET","HEAD"].indexOf(req.method) >= 0) {
		debug("api access public");
		return next();
	}
	if (req.user)  {
		debug("api access by user %s", req.user.name);
		return next();
	}
	var apikey = req.body.apikey || req.query.apikey || null;
	if (!apikey) return res.status(403).json({error: new Error("Access Denied. Please provide a valid API Key (#1)").toString()});
	if (!config.api.keys.hasOwnProperty(apikey)) return res.status(403).json({error: new Error("Access Denied. Please provide a valid API Key (#2)").toString()});
	debug("api access by %s", config.api.keys[apikey]);
	next();
});

// search api, get
app.get("/api/search-fields", function (req, res) {
	api.search_fields(function(err, result){
		res.type("json").status("200").json({err: ((err)?err.message:null), result: result});
	});
});

// search api, get
app.get("/api/search", function (req, res) {

	// sanitize query
	if (!req.query.hasOwnProperty("q")) return res.type("json").status("200").json({error: "no query", result: []});
	try { var query = JSON.parse(req.query.q); } catch (err) { return res.type("json").status("200").json({error: err.message, result: []}); }

	// perform search
	api.search(query, function(err, result){
		res.type("json").status("200").json({err: ((err)?err.message:null), result: result});
	});
});

// search api, post
app.post("/api/search", function (req, res) {

	// check for query property
	if (!req.body.hasOwnProperty("q")) return res.type("json").status("200").json({error: "no query", result: []});

	// try to parse if no json
	if (typeof req.body.q === "object") var query = req.body.q;
	else if (typeof req.body.q === "string") try { var query = JSON.parse(req.body.q); } catch (err) { return res.type("json").status("200").json({error: err.message, result: []}); }
	else return res.type("json").status("200").json({error: "invalid query", result: []});
	
	// perform search
	api.search(q, function(err, result){
		res.type("json").status("200").json({err: ((err)?err.message:null), result: result});
	});
});

// route api, get+post
app.all("/api/route/:from/:to", function (req, res) {

	// perform route search
	api.route(req.params.from, req.params.to, function(err, result){
		res.type("json").status("200").json({err: ((err)?err.message:null), result: result||null});
	});
});

// whitelist
app.get("/api/plugin/whitelist", function (req, res) {
	debug("get plugin whitelist");
	api.whitelist_get(function(err, result){
		res.type("json").status("200").json({err: ((err)?err.message:null), result: result});
	});
});

// export.
app.all("/api/plugin/export", function (req, res) {
	debug("export");
	api.ent_export(function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// create entity. 
app.post("/api/entity/create", function (req, res) {
	debug("create entity for \"%s\"", req.body.ent.name);
	api.ent_create(req.body.ent, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// get entity.
app.all("/api/entity/get/:id", function (req, res) {
	debug("get entity %s", req.params.id);
	api.ent_get(req.params.id, function (err, result) {
		if (result && req.query && req.query.relations) {
			return api.ent_rels(result._id, function (err, rels) {
				result.relations = rels;
				res.type("json").status("200").json({error: nice_error(err), result: result});
			});
		}
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// get entities.
app.get("/api/entity/list", function (req, res) {
	debug("list entities");
	api.ent_list(req.query, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// get entities for backend.
app.get("/api/entity/list2", function (req, res) {
	debug("list full entities");
	api.ent_list_full(req.query, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// delete entity.
app.post("/api/entity/delete/:id", function (req, res) {
	debug("delete entity %s", req.params.id||req.body.id);
	api.ent_delete(req.params.id||req.body.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// update entity.
app.post("/api/entity/update/:id", function (req, res) {
	debug("update entity %s", req.params.id||req.body.id);
	api.ent_update(req.params.id||req.body.id, req.body.ent, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// upmerge entity.
app.post("/api/entity/upmerge/:id", function (req, res) {
	debug("upmerge entity %s", req.params.id||req.body.id);
	api.ent_upmerge(req.params.id||req.body.id, req.body.ent, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// merge entities.
app.post("/api/entity/merge", function (req, res) {
	debug("merge entity %s", req.body.ids);
	api.ent_merge(req.body.ids, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// entity types.
app.all("/api/entity/types", function (req, res) {
	debug("entity types");
	api.ent_types(function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// entity tags.
app.all("/api/entity/tags", function (req, res) {
	debug("entity tags");
	api.ent_tags(function(err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// export.
app.all("/api/entity/export", function (req, res) {
	debug("relation tags");
	api.ent_export(function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// set tags on multiple entities.
app.post("/api/entity/multitags", function (req, res) {
	debug("multitags");
	api.ent_multitags(req.body.mode, req.body.tag, req.body.ids, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// create relation.
app.post("/api/relation/create", function (req, res) {
	debug("create relation");
	api.rel_create(req.body.rel||req.body.relation, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// get relation.
app.all("/api/relation/get/:id", function (req, res) {
	debug("get relation %s", req.params.id);
	api.rel_get(req.params.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// delete relation.
app.post("/api/relation/delete/:id", function (req, res) {
	debug("delete relation %s", req.params.id||req.body.id);
	api.rel_delete(req.params.id||req.body.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// update relation.
app.post("/api/relation/update/:id", function (req, res) {
	debug("update relation %s", req.params.id||req.body.id);
	api.rel_update(req.params.id||req.body.id, req.body.rel||req.body.relation, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// upmerge relation.
app.post("/api/relation/upmerge/:id", function (req, res) {
	debug("upmerge relation %s", req.params.id||req.body.id);
	api.rel_upmerge(req.params.id||req.body.id, req.body.rel, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// relation types.
app.all("/api/relation/types", function (req, res) {
	debug("relation types");
	api.rel_types(function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// relation tags.
app.all("/api/relation/tags", function (req, res) {
	debug("relation tags");
	api.rel_tags(function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// set tags on multiple entities.
app.post("/api/relation/multitags", function (req, res) {
	debug("multitags relation");
	api.rel_multitags(req.body.mode, req.body.tag, req.body.ids, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// relations by tag.
app.all("/api/relation/tagged/:tag", function (req, res) {
	debug("relations by tag %s", req.params.tag);
	api.rels_by_tag(req.params.tag, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// list of relations.
app.all("/api/relation/list", function (req, res) {
	debug("relation list");
	api.rels_full(req.query, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// get users.
app.get("/api/users/list", function (req, res) {
	debug("list users");
	if (!req.user || !req.user.admin) res.sendStatus(401);
	api.user_list(function (err, result) {
		result = (!result) ? null : result.map(function(u){
			//remove password
			return {
				_id: u._id,
				name: u.name,
				admin: u.admin
			}
		});
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// create user.
app.post("/api/users/create", function (req, res) {
	debug("create user", req.body.user);
	if (!req.user || !req.user.admin) res.sendStatus(401);
	api.user_create(req.body.user, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// delete user.
app.all("/api/users/delete/:id", function (req, res) {
	debug("delete user %s", req.params.id||req.body.id);
	if (!req.user || !req.user.admin) res.sendStatus(401);
	api.user_delete(req.params.id||req.body.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// get user.
app.all("/api/users/get/:id", function (req, res) {
	debug("get user %s", req.params.id);
	if (!req.user || !req.user.admin) res.sendStatus(401);
	api.user_get(req.params.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// update user.
app.post("/api/users/update/:id", function (req, res) {
	debug("update user %s", req.params.id||req.body.id);
	if (!req.user || !req.user.admin) res.sendStatus(401);
	api.user_update(req.params.id||req.body.id, req.body.user, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// get whitelist.
app.get("/api/whitelist/list", function (req, res) {
	debug("list whitelist");
	api.whitelist_get(function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// create whitelist.
app.post("/api/whitelist/create", function (req, res) {
	debug("create whitelist entry", req.body.site);
	api.whitelist_add(req.body.site, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// update whitelist.
app.post("/api/whitelist/update", function (req, res) {
	debug("update whitelist entry", req.body.site, req.body.replacement);
	api.whitelist_update(req.body.site, req.body.replacement, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// delete whitelist.
app.post("/api/whitelist/delete", function (req, res) {
	debug("delete whitelist entry %s", req.body.site);
	api.whitelist_remove(req.body.site, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// get fields.
app.get("/api/fields/list", function (req, res) {
	debug("list fields");
	api.field_list(req.query.mode, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// create field.
app.post("/api/fields/create", function (req, res) {
	debug("create field", req.body.field);
	api.field_create(req.body.field, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// delete field.
app.all("/api/fields/delete/:id", function (req, res) {
	debug("delete field %s", req.params.id||req.body.id);
	api.field_delete(req.params.id||req.body.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// get autocomplete for fields.
app.all("/api/field/autocomplete", function (req, res) {
	debug("get field autocomplete %s", req.query.q);
	api.field_autocomplete(req.query, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// get field.
app.all("/api/fields/get/:id", function (req, res) {
	debug("get field %s", req.params.id);
	api.field_get(req.params.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// update field.
app.post("/api/fields/update/:id", function (req, res) {
	debug("update field %s", req.params.id||req.body.id);
	api.field_update(req.params.id||req.body.id, req.body.field, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// get fields from entities.
app.get("/api/fields/entities", function (req, res) {
	debug("get fields from entities");
	api.field_ents(function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// get tags.
app.all("/api/tags/list", function (req, res) {
	debug("get tags");
	api.tags(req.query.type, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// current user.
app.get("/user", function (req, res) {
	if (req.user) res.type("json").status("200").json({error: null, result: {name:req.user.name,admin:req.user.admin}});
	else res.type("json").sendStatus(401);
});

// login user.
app.post('/login', function (req, res, next) {
	passport.authenticate('local', function (err, user, info) {
		if (err) return next(err);
		if (!user)  return res.sendStatus(401);
		req.logIn(user, function (err) {
			if (err) return next(err);
			res.type("json").status("200").json({error: null, result: {name:user.name,admin:user.admin}});
		});
	})(req, res, next);
});

// logout user.
app.post('/logout', function (req, res, next) {
	req.logout();
	res.sendStatus(200);
});

// default api method.
app.all("/api", function (req, res) {
	res.type("json").status("200").json({error: null});
});

// entity page
app.all("/entity/:id", function (req, res) {
	api.ent_get(req.params.id, function (err, ent) {
		if (err) return res.render("entity", { "err": err });
		if (ent === null || !ent.hasOwnProperty("_id")) return res.status(404).render("404", { "err": "Diese Entität existiert nicht" });
		api.ent_rels(ent._id, function (err, rels) {
			ent.relations = rels;
			// rework data
			ent.data = ent.data.filter(function(d){
				switch (d.key) {
					case "source":
						if (!ent.hasOwnProperty("sources")) ent.sources = [];
						ent.sources.push(d.value);
					break;
					case "address":
						if (!ent.hasOwnProperty("addresses")) ent.addresses = [];
						ent.addresses.push(d.value);
					break;
					// other stuff here
					default: return true; break;
				}
				return false;
			});

			// dates
			ent.created = moment(ent.created).format("DD.MM.YYYY hh:mm");
			ent.updated = moment(ent.updated).format("DD.MM.YYYY hh:mm");

			// aliases and tags
			if (ent.aliases.length > 0) ent.has_aliases = true;
			if (ent.tags.length > 0) ent.has_tags = true;
			if (ent.sources && ent.sources.length > 0) ent.has_sources = true;
			if (ent.addresses && ent.addresses.length > 0) ent.has_addresses = true;
			
			res.render("app", { // we render index instead and load entity via ajax from FE
				"err": err,
				"entity": ent
			});
		});
	});
});

// listing page
app.all("/list/:type/:letter?", function (req, res) {
	var cond = {};

	if (req.params.hasOwnProperty("letter") && /^[a-z0-9]$/i.test(req.params.letter)) cond.letter = req.params.letter;
	if (req.params.hasOwnProperty("type") && ["person", "organisation", "entity"].indexOf(req.params.type) >= 0) cond.type = req.params.type;

	api.ent_list(cond, function (err, list) {
		list = list.map(function (item) {
			switch (item.type) {
				case "person":
					item.icon = "user";
					break;
				case "organisation":
					item.icon = "building";
					break;
				case "entity":
					item.icon = "building";
					break;
			}
			return item;
		});
		var tmpl = {"list": {"type": (cond.type || "all"), "err": err, "item": list}};
		if (cond.letter) tmpl["letter_" + cond.letter] = true;
		if (cond.type) {
			tmpl["nav_" + cond.type] = true;
			tmpl["hl_" + cond.type] = true;
		} else {
			tmpl["hl_all"] = true;
		}
		res.render("app", tmpl);
	});
});

// autocomplete
app.get("/api/autocomplete", function (req, res) {
	if (!req.query.hasOwnProperty("q") || req.query.q === null || req.query.q === "") return res.status(200).json([]);
	api.autocomplete(req.query.q, function(err, result){
		res.status(200).json(result);
	});
});

// clean db.
app.get("/api/db/clean", function (req, res) {
	debug("clean db command");
	if( (!req.user)|| (req.user.name!=='admin')) return res.status("200").send('nope');
	api.db_clean(function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});


// index page
app.all("/", function (req, res) { res.render("index", {}); });

// FAQ Page (static)
app.get("/oft-gestellte-fragen", function (req, res) { res.render("faq", {}); });

// FAQ Page (static)
app.get("/artikel", function (req, res) { res.render("articles", {}); });

// Abspann Page (static)
app.get("/abspann", function (req, res) {
		res.render("abspann", {});
});

// Intro Page (static)
app.get("/um-was-geht-es", function (req, res) {
		res.render("intro", {});
});

// Abspann Page (static)
app.get("/download-plugin", function (req, res) {
		res.render("extension", {});
});


// Abspann Page (static)
app.get("/ueber-uns", function (req, res) {
		res.render("about", {});
});

// Abspann Page (static)
app.get("/verbindungssuche", function (req, res) {
		res.render("app", {});
});

//// Relation Viz
app.get("/relation/:tag", function (req, res) {
	res.render("relation", {tag: req.params.tag});
});

// Search Page (static)
app.get("/search/:id", function (req, res) {
		res.render("app", {});
});

// everything else is 404
app.all("*", function (req, res) {
	res.status(404).render("404", { "err": "Wir konnten unter dieser URL leider nichts finden." });
});

if (config.defaultadmin) {
	api.user_create({name: config.defaultadmin.name, pass: config.defaultadmin.pass, admin: true}, function () {});
}

// determine listen method
if (config.listen.hasOwnProperty("host") && config.listen.hasOwnProperty("port")) {
	// listen on tcp
	app.listen(config.listen.port, config.listen.host, function () {
		debug("listening on %s:%d", config.listen.host, config.listen.port);
	});
} else if (config.listen.hasOwnProperty("port")) {
	// listen on tcp
	app.listen(config.listen.port, config.listen.host, function () {
		debug("listening on %s:%d", config.listen.host, config.listen.port);
	});
} else if (config.listen.hasOwnProperty("socket")) {
	// listen on socket
	var sockfile = path.resolve(config.listen.socket);
	fs.exists(sockfile, function (ex) {
		var umask = process.umask(0000);
		(function (fn) {
			// delete existing socket and start listening
			if (ex) return fs.unlink(sockfile, function (err) {
				if (err) console.error(err) || process.exit();
				debug("cleaned up old socket %s", path.basename(sockfile));
				return fn();
			});
			fn();
		})(function () {
			app.listen(sockfile, function () {
				debug("listening on socket %s", path.basename(sockfile));
				process.umask(umask);
			});
		});
	});
} else {
	// listen to your heart
	console.error("you have to configure a socket or port");
	process.exit();
}

// delete socket before exiting on SIGINT
process.on("SIGINT", function () {
	if (sockfile) return fs.unlink(sockfile, function (err) {
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
