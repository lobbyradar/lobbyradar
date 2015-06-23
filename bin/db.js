var debug = require("debug")("bin.db");
var async = require("async");
var mongojs = require("mongojs");
var path = require("path");
var fs = require("fs");

/*

 cleanup entities & relations in mongo db

 -duplicate data fields
 -empty data fields
 -known importer errors

 */

// load config
var config = require(path.resolve(__dirname, "../config.js"));

// load mongojs
var db = mongojs(config.db, ["entities", "relations", "dataindex"]);

// local modules
var api = require(path.resolve(__dirname, "../lib/api.js"))(config.api, db);

var clone = function (obj) {
	return JSON.parse(JSON.stringify(obj));
};

var State = function () {
	var me = this;
	me.remove_data = [];
	me.change_data = [];
	me.added_data = [];
	me.removed_rel = false;
	me.changed_rel = false;
	me.changed = function (reason, data) {
		me.change_data.push({reason: reason, data: clone(data)});
	};
	me.removed = function (reason, data) {
		me.remove_data.push({reason: reason, data: clone(data)});
	};
	me.added = function (reason, data) {
		me.added_data.push({reason: reason, data: clone(data)});
	};
};

module.exports.run = function (entity_checks, relations_checks, fn) {

	var report = [];

	var fixEntities = function (cb) {
		console.log('Iterate Entities');
		api.ents(function (err, ents) {
			if (err) return cb(err);
			async.forEachSeries(ents, function (ent, next) {
				var state = new State();
				entity_checks.forEach(function (check) {
					check(ent, state);
				});
				if (state.remove_data.length > 0) {
					ent.data = ent.data.filter(function (d) {
						return state.remove_data.filter(function (r) {
								return r.data.id == d.id;
							}).length == 0;
					});
				}
				if (state.added_data.length + state.remove_data.length + state.change_data.length > 0) {
					api.ent_store(ent, function (err) {
						if (err) console.log(err);
						var info = {
							ent: ent,
							state: state
						};
						report.push(info);
						next();
					});
				} else {
					setImmediate(next); //nothing to do
				}
			}, function () {
				cb(null, ents);
			});
		});
	};

	var fixRelations = function (entities, cb) {
		console.log('Iterate Relations');
		api.rels_full({full: true}, function (err, rels) {
			if (err) return fn(err);
			async.forEachSeries(rels, function (rel, next) {
				var state = new State();
				relations_checks.forEach(function (check) {
					check(rel, state, entities);
				});

				if (state.removed_rel) {
					return api.rel_delete(rel._id, function (err) {
						report.push({
							removed_rel: rel,
							reason: state.remove_rel
						});
						if (err) return console.log(err);
						return next();
					});
				}

				if (state.remove_data.length > 0) {
					rel.data = rel.data.filter(function (d) {
						return state.remove_data.filter(function (r) {
								return r.data.id == d.id;
							}).length == 0;
					});
				}
				if (state.changed_rel || (state.added_data.length + state.remove_data.length + state.change_data.length > 0)) {
					api.rel_store(rel, function (err) {
						//api.rel_get(rel._id,function(err,rel2){
						if (err) console.log(err);
						var info = {
							rel: rel,
							state: state
						};
						report.push(info);
						next();
						//});
					});
				} else {
					setImmediate(next); //nothing to do
				}
			}, function () {
				cb();
			});
		});
	};

	fixEntities(function (err, entities) {
		if (err) return console.log(err);
		fixRelations(entities, function () {
			if (report.length > 0) {
				console.log(report.length, 'changes');
				var dir = path.resolve(__dirname, 'log');
				if (!fs.existsSync(dir)) fs.mkdirSync(dir, 777);
				var filename = path.resolve(dir, 'cleanup-log-' + (new Date()).valueOf() + '.json');
				fs.writeFileSync(filename, JSON.stringify(report, null, '\t'));
			}
			fn && fn();
			console.log('done');
			process.exit();
		});
	});

};