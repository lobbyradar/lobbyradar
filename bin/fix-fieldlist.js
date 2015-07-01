var mongojs = require("mongojs");
var debug = require("debug")("check fields");
var async = require("async");
var path = require("path");
var fs = require("fs");
var utils = require("../lib/utils.js");

// load config
var config = require(path.resolve(__dirname, "../config.js"));

// load mongojs
var db = mongojs(config.db, ["entities", "relations", "dataindex"]);

// local modules
var api = require(path.resolve(__dirname, "../lib/api.js"))(config.api, db);

var fixFields = function (cb) {
	console.log('Fixing Fieldlist');

	var fieldtypes = {};

	var toList = function (obj) {
		return Object.keys(obj).map(function (key) {
			return obj[key];
		}).sort(function (a, b) {
			if (a.mode < b.mode)return -1;
			if (a.mode > b.mode)return 1;
			if (a.format < b.format)return -1;
			if (a.format > b.format)return 1;
			if (a.key < b.key)return -1;
			if (a.key > b.key)return 1;
			if (a.name < b.name)return -1;
			if (a.name > b.name)return 1;
			return 0;
		})
	};

	var logEntityFieldType = function (d, ent) {
		var mode = ent.type == 'person' ? 'persons' : 'organisations';
		var id = [d.key, d.format, d.desc, mode].join('|');
		fieldtypes[id] = fieldtypes[id] || {mode: mode, format: d.format, key: d.key, name: d.desc}
	};

	var logRelationFieldType = function (d) {
		var id = [d.key, d.format, d.desc, 'relations'].join('|');
		fieldtypes[id] = fieldtypes[id] || {mode: 'relations', format: d.format, key: d.key, name: d.desc}
	};

	var removeOldRelationFields = function (fields, cb) {
		async.forEachSeries(fields, function (t, next) {
				if (t.mode == 'relations' && (['activity', 'association', 'donation'].indexOf(t.format) < 0)) {
					console.log('removing old field', JSON.stringify(t));
					api.field_delete(t._id, next);
				} else
					next();
			}, cb
		);
	};

	api.field_list(null, function (err, fields) {
		removeOldRelationFields(fields, function () {
			api.ents(function (err, ents) {
				ents.forEach(function (ent) {
					ent.data.forEach(function (d) {
						logEntityFieldType(d, ent);
					});
				});
				api.rels_full({full: true}, function (err, rels) {
					rels.forEach(function (rel) {
						rel.data.forEach(logRelationFieldType);
					});
					var fields_in_use = toList(fieldtypes);
					var new_fields = fields_in_use.filter(function (t) {
						var flist = fields.filter(function (f) {
							return ((f.key == t.key) && (f.mode == t.mode) && (f.format == t.format) && (f.name == t.name));
						});
						return (flist.length == 0);
					});
					if (!new_fields.length) return cb();
					console.log(new_fields.length, 'new fields');
					async.forEachSeries(new_fields, function (t, next) {
							api.field_create(t, next);
						}, cb
					);
				});
			});
		});
	});
};

fixFields(function () {
	console.log('done');
	process.exit();
});
