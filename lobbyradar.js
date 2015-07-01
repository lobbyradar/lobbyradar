#!/usr/bin/env node

// node modules
var passportlocal = require("passport-local");
var cookieParser = require('cookie-parser');
var bodyparser = require("body-parser");
var passport = require("passport");
var mustache = require("mustache-express");
var session = require('express-session');
var sessionJSONstore = require('express-session-json-store')(session);
var express = require("express");
var mongojs = require("mongojs");
var moment = require("moment");
var debug = require("debug")("app");
var path = require("path");
var unq = require("unq");
var nsa = require("nsa");
var fs = require("fs");
var favicon = require('serve-favicon');

// config
var config = require("./config.js");

// check config for listen directive
if (!config.hasOwnProperty("listen")) {
	coneole.error("you have to configure a socket or port");
	process.exit();
}

// database connection 
var db = mongojs(config.db, ["entities", "relations", "users", "fields", "whitelist", "dataindex"]);

// api instance
var api = require("./lib/api.js")(config.api, db);

// use nsa if configured
if (config.hasOwnProperty("nsa") && (config.nsa)) {
	var heartbeat = new nsa({
		server: config.nsa,
		service: "lobbyradar",
		interval: "10s"
	}).start(function () {
			debug("started heartbeat");
		});
}

// configure passport
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
//_mustache.cache = false;
app.engine("mustache", _mustache);
app.set("view engine", "mustache");
app.set("views", path.resolve(__dirname, "assets/views"));

app.use(favicon(__dirname + '/assets/images/favicon.ico'));

// static assets
app.use("/assets", express.static(path.resolve(__dirname, "assets")));

// static backend
app.use("/station", express.static(path.resolve(__dirname, "station")));

// cookie parser
app.use(cookieParser(config.secret));
var sessionMiddleware = session({
	secret: config.secret,
	resave: false,
	name: 'lobbyradar-seesion',
	saveUninitialized: false,
	store: new sessionJSONstore({
		path: __dirname,
		ttl: 0, //station session are valid forever
		saveInterval: 60 * 1000
	})
});

//app.use(passport.initialize());

var passportMiddleware = passport.initialize();
var passportSessionMiddleware = passport.session();
function sessionHandler(req, res, next) {
	sessionMiddleware(req, res, function () {
		passportMiddleware(req, res, function () {
			passportSessionMiddleware(req, res, next);
		})
	});
}

function sessionUserHandler(req, res, next) {
	sessionHandler(req, res, function () {
		if (!req.user) return res.sendStatus(401);
		next();
	});
}
function sessionAdminHandler(req, res, next) {
	sessionHandler(req, res, function () {
		if (!req.user || !req.user.admin) return res.sendStatus(401);
		next();
	});
}

// parse application/json
app.use(bodyparser.json({
	limit: '20mb'
}));

// use bodyparser for urlencoded forms
app.use(bodyparser.urlencoded({
	extended: false
}));

// helper method for resutning errors
var nice_error = function (err) {
	if (!err) return;
	return err.toString();
};

// index page
app.all("/", function (req, res) {
	res.render("index", {});
});

// FAQ Page (static)
app.get("/oft-gestellte-fragen", function (req, res) {
	res.render("faq", {});
});

// FAQ Page (static)
app.get("/artikel", function (req, res) {
	res.render("articles", {});
});

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

// Search Page (static)
app.get("/search/:id", function (req, res) {
	res.render("app", {});
});

// Entity page (static)
app.all("/entity/:id", function (req, res) {
	res.render("app", {});
});

// Relation Viz
app.get("/relation/:tag", function (req, res) {
	res.render("relation", {});
});

// default api method.
app.all("/api", function (req, res) {
	res.type("json").status("200").json({error: null});
});

// autocomplete
app.get("/api/autocomplete", function (req, res) {
	if (!req.query.hasOwnProperty("q") || req.query.q === null || req.query.q === "") return res.status(200).json([]);
	api.autocomplete(req.query.q, function (err, result) {
		res.status(200).json(result);
	});
});

// search api, get
app.get("/api/search-fields", function (req, res) {
	api.search_fields(function (err, result) {
		res.type("json").status("200").json({err: ((err) ? err.message : null), result: result});
	});
});

// search api, get
app.get("/api/search", function (req, res) {

	// sanitize query
	if (!req.query.hasOwnProperty("q")) return res.type("json").status("200").json({error: "no query", result: []});
	try {
		var query = JSON.parse(req.query.q);
	} catch (err) {
		return res.type("json").status("200").json({error: err.message, result: []});
	}

	// perform search
	api.search(query, function (err, result) {
		res.type("json").status("200").json({err: ((err) ? err.message : null), result: result});
	});
});

// search api, post
app.post("/api/search", function (req, res) {

	// check for query property
	if (!req.body.hasOwnProperty("q")) return res.type("json").status("200").json({error: "no query", result: []});

	// try to parse if no json
	if (typeof req.body.q === "object") var query = req.body.q;
	else if (typeof req.body.q === "string") try {
		var query = JSON.parse(req.body.q);
	} catch (err) {
		return res.type("json").status("200").json({error: err.message, result: []});
	}
	else return res.type("json").status("200").json({error: "invalid query", result: []});
	
	// perform search
	api.search(q, function (err, result) {
		res.type("json").status("200").json({err: ((err) ? err.message : null), result: result});
	});
});

// route api, get+post
app.all("/api/route/:from/:to", function (req, res) {

	// perform route search
	api.route(req.params.from, req.params.to, function (err, result) {
		res.type("json").status("200").json({err: ((err) ? err.message : null), result: result || null});
	});
});

// whitelist
app.get("/api/plugin/whitelist", function (req, res) {
	debug("get plugin whitelist");
	res.set('Content-Type', 'application/json');
	res.sendfile('whitelist.json', {
		maxAge: 60 * 60 * 1000,
		root: __dirname + '/assets/data/'
	});
});

// export.
app.all("/api/plugin/export", function (req, res) {
	debug("export");
	res.set('Content-Type', 'application/json');
	res.sendfile('entities.json', {
		maxAge: 60 * 60 * 1000,
		root: __dirname + '/assets/data/'
	});
});

// whitelist
app.get("/api/plugin/whitelist-live", function (req, res) {
	debug("get plugin whitelist");
	api.whitelist_get(function (err, result) {
		res.type("json").status("200").json({err: ((err) ? err.message : null), result: result});
	});
});

// export.
app.all("/api/plugin/export-live", function (req, res) {
	debug("export");
	api.ent_export(function (err, result) {
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
	api.ent_tags(function (err, result) {
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

// get relation.
app.all("/api/relation/get/:id", function (req, res) {
	debug("get relation %s", req.params.id);
	api.rel_get(req.params.id, function (err, result) {
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

// get whitelist.
app.get("/api/whitelist/list", function (req, res) {
	debug("list whitelist");
	api.whitelist_get(function (err, result) {
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
app.get("/user", sessionUserHandler, function (req, res) {
	res.type("json").status("200").json({error: null, result: {name: req.user.name, admin: req.user.admin}});
});

// login user.
app.post('/login', sessionHandler, function (req, res, next) {
	passport.authenticate('local', function (err, user, info) {
		if (err) return next(err);
		if (!user)  return res.sendStatus(401);
		req.logIn(user, function (err) {
			if (err) return next(err);
			req.session.authenticated = true;
			res.type("json").status("200").json({error: null, result: {name: user.name, admin: user.admin}});
		});
	})(req, res, next);
});

// logout user.
app.post('/logout', sessionHandler, function (req, res, next) {
	req.logout();
	res.sendStatus(200);
});

// get users.
app.get("/api/users/list", sessionAdminHandler, function (req, res) {
	debug("list users");
	api.user_list(function (err, result) {
		result = (!result) ? null : result.map(function (u) {
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

// delete field.
app.all("/api/fields/delete/:id", sessionUserHandler, function (req, res) {
	debug("delete field %s", req.params.id || req.body.id);
	api.field_delete(req.params.id || req.body.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// create entity.
app.post("/api/entity/create", sessionUserHandler, function (req, res) {
	debug("create entity for \"%s\"", req.body.ent.name);
	api.ent_create(req.body.ent, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// get user.
app.all("/api/users/get/:id", sessionAdminHandler, function (req, res) {
	debug("get user %s", req.params.id);
	api.user_get(req.params.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// delete user.
app.all("/api/users/delete/:id", sessionAdminHandler, function (req, res) {
	debug("delete user %s", req.params.id || req.body.id);
	api.user_delete(req.params.id || req.body.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// create user.
app.post("/api/users/create", sessionAdminHandler, function (req, res) {
	debug("create user", req.body.user);
	api.user_create(req.body.user, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// update user.
app.post("/api/users/update/:id", sessionAdminHandler, function (req, res) {
	debug("update user %s", req.params.id || req.body.id);
	api.user_update(req.params.id || req.body.id, req.body.user, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// create whitelist.
app.post("/api/whitelist/create", sessionUserHandler, function (req, res) {
	debug("create whitelist entry", req.body.site);
	api.whitelist_add(req.body.site, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// update whitelist.
app.post("/api/whitelist/update", sessionUserHandler, function (req, res) {
	debug("update whitelist entry", req.body.site, req.body.replacement);
	api.whitelist_update(req.body.site, req.body.replacement, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// delete whitelist.
app.post("/api/whitelist/delete", sessionUserHandler, function (req, res) {
	debug("delete whitelist entry %s", req.body.site);
	api.whitelist_remove(req.body.site, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// create field.
app.post("/api/fields/create", sessionUserHandler, function (req, res) {
	debug("create field", req.body.field);
	api.field_create(req.body.field, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// update field.
app.post("/api/fields/update/:id", sessionUserHandler, function (req, res) {
	debug("update field %s", req.params.id || req.body.id);
	api.field_update(req.params.id || req.body.id, req.body.field, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// set tags on multiple entities.
app.post("/api/relation/multitags", sessionUserHandler, function (req, res) {
	debug("multitags relation");
	api.rel_multitags(req.body.mode, req.body.tag, req.body.ids, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// delete entity.
app.post("/api/entity/delete/:id", sessionUserHandler, function (req, res) {
	debug("delete entity %s", req.params.id || req.body.id);
	api.ent_delete(req.params.id || req.body.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// update entity.
app.post("/api/entity/update/:id", sessionUserHandler, function (req, res) {
	debug("update entity %s", req.params.id || req.body.id);
	api.ent_update(req.params.id || req.body.id, req.body.ent, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// upmerge entity.
app.post("/api/entity/upmerge/:id", sessionUserHandler, function (req, res) {
	debug("upmerge entity %s", req.params.id || req.body.id);
	api.ent_upmerge(req.params.id || req.body.id, req.body.ent, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// merge entities.
app.post("/api/entity/merge", sessionUserHandler, function (req, res) {
	debug("merge entity %s", req.body.ids);
	api.ent_merge(req.body.ids, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// set tags on multiple entities.
app.post("/api/entity/multitags", sessionUserHandler, function (req, res) {
	debug("multitags");
	api.ent_multitags(req.body.mode, req.body.tag, req.body.ids, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// create relation.
app.post("/api/relation/create", sessionUserHandler, function (req, res) {
	debug("create relation");
	api.rel_create(req.body.rel || req.body.relation, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// delete relation.
app.post("/api/relation/delete/:id", sessionUserHandler, function (req, res) {
	debug("delete relation %s", req.params.id || req.body.id);
	api.rel_delete(req.params.id || req.body.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// update relation.
app.post("/api/relation/update/:id", sessionUserHandler, function (req, res) {
	debug("update relation %s", req.params.id || req.body.id);
	api.rel_update(req.params.id || req.body.id, req.body.rel || req.body.relation, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// upmerge relation.
app.post("/api/relation/upmerge/:id", sessionUserHandler, function (req, res) {
	debug("upmerge relation %s", req.params.id || req.body.id);
	api.rel_upmerge(req.params.id || req.body.id, req.body.rel, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// list imports.
app.get("/api/update/entity/list", sessionUserHandler, function (req, res) {
	debug("list imports");
	api.update_list(function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

app.get("/api/update/entity/get/:id", sessionUserHandler, function (req, res) {
	debug("get update ", req.params.id);
	api.update_entity_info_id(req.params.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

app.post("/api/update/entity/delete/:id", sessionUserHandler, function (req, res) {
	debug("delete update ", req.params.id || req.body.id);
	api.update_ent_delete(req.params.id || req.body.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

app.post("/api/update/entity/apply/:id", sessionUserHandler, function (req, res) {
	debug("apply entity update ", req.params.id || req.body.id);
	api.update_ent_apply(req.params.id || req.body.id, req.params.data_id || req.body.data_id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

app.post("/api/update/entity/choose/:id", sessionUserHandler, function (req, res) {
	debug("choose update entity %s", req.params.id || req.body.id);
	api.update_ent_choose(req.params.id || req.body.id, req.body.ent, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

app.post("/api/update/entity/save/:id", sessionUserHandler, function (req, res) {
	debug("save update entity %s", req.params.id || req.body.id);
	api.update_ent_update(req.params.id || req.body.id, req.body.ent, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

app.post("/api/update/relation/delete/:id", sessionUserHandler, function (req, res) {
	debug("delete update relation ", req.params.id || req.body.id);
	api.update_rel_delete(req.params.id || req.body.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

app.post("/api/update/relation/apply/:id", sessionUserHandler, function (req, res) {
	debug("apply relation data update ", req.params.id || req.body.id);
	api.update_rel_apply(req.params.id || req.body.id, req.params.data_id || req.body.data_id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

app.post("/api/update/entity/create/:id", sessionUserHandler, function (req, res) {
	debug("create update entity", req.params.id || req.body.id);
	api.update_ent_create(req.params.id || req.body.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

app.post("/api/update/relation/create/:id", sessionUserHandler, function (req, res) {
	debug("create update relation", req.params.id || req.body.id);
	api.update_rel_create(req.params.id || req.body.id, function (err, result) {
		res.type("json").status("200").json({error: nice_error(err), result: result});
	});
});

// everything else is 404
app.all("*", function (req, res) {
	res.status(404).render("404", {"err": "Wir konnten unter dieser URL leider nichts finden."});
});

if (config.defaultadmin) {
	api.user_find(config.defaultadmin.name, function (err, user) {
		if (err) console.log(err);
		if (!user)
			api.user_create({name: config.defaultadmin.name, pass: config.defaultadmin.pass, admin: true}, function (err) {
				if (err) console.log(err);
			});
	});
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
		if (heartbeat) return heartbeat.end(function () {
			debug("ended heartbeat");
			process.exit();
		});
		process.exit();
	});
	if (heartbeat) return heartbeat.end(function () {
		debug("ended heartbeat");
		process.exit();
	});
	process.exit();
});
