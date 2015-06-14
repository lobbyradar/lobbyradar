var mongojs = require("mongojs");
var debug = require("debug")("cleanup");
var async = require("async");
var path = require("path");
var fs = require("fs");
var utils = require("../lib/utils.js");

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

var list = [];
//var mdbs = [];

var emptyOrNull = function (s) {
	return s == null || (s.length == 0);
};

var checkFieldsByFormat = function (data, remove_list, change_list) {
	data.forEach(function (d) {
		if (d.format == 'string') {
			if (emptyOrNull(d.value)) {
				remove_list.push(d);
			} else if (d.value.indexOf('tellvertretend') == 0) {
				hasChanged = true;
				d.value = 'S' + d.value;
				change_list.push(d);
			}
		} else if (d.format == 'link') {
			if (!d.value || emptyOrNull(d.value.url)) {
				remove_list.push(d);
			} else if (d.value && d.value.remark == 'Fraktion undefined') {
				d.value.remark = 'Fraktion';
				change_list.push(d);
			}
		} else if (d.format == 'address') {
			if ((!d.value) || (
					emptyOrNull(d.value.country) &&
					emptyOrNull(d.value.postcode) &&
					emptyOrNull(d.value.city) &&
					emptyOrNull(d.value.www) &&
					emptyOrNull(d.value.name) &&
					emptyOrNull(d.value.email) &&
					emptyOrNull(d.value.addr)
				))
				remove_list.push(d);
		} else if (d.format == 'photo') {
			if (d.value.addr || d.value.email) {
				d.format = 'address';
				d.desc = 'Adresse';
				d.key = 'address';
				change_list.push(d);
			} else if (
				emptyOrNull(d.value.url) &&
				emptyOrNull(d.value.copyright)
			)
				remove_list.push(d);
		} else if (d.format == 'number') {
			if (d.value === null) remove_list.push(d);
		} else if (d.format == 'url') {
			if (d.value === null) remove_list.push(d);
		} else if (d.format == 'date') {
			if (d.value === null) remove_list.push(d);
		} else if (d.format == 'integer') {
			if (d.value === null) remove_list.push(d);
		} else if (d.format == 'bool') {
		} else {
			console.log('TODO cleanup format validate:', d.format, d.value);
		}
	});
};

var filterDupFields = function (data, remove_list) {
	for (var i = 0; i < data.length; i++) {
		var d = data[i];
		for (var j = i + 1; j < data.length; j++) {
			var d2 = data[j];
			if (utils.fields_equal(d, d2)) {
				d2.removal = 'Duplicate';
				remove_list.push(d2);
			}
		}
	}
};

var fixEntities = function (cb) {
	api.ents(function (err, ents) {
		if (err) return fn(err);
		async.forEachSeries(ents, function (ent, next) {
			var remove_list = [];
			var change_list = [];

			checkFieldsByFormat(ent.data, remove_list, change_list);
			filterDupFields(ent.data, remove_list);

			if (remove_list.length > 0) {
				ent.data = ent.data.filter(function (d) {
					return remove_list.indexOf(d) < 0;
				});
			}

			if (remove_list.length + change_list.length > 0) {
				api.ent_store(ent, function (err) {
					if (err) console.log(err);
					var info = {
						ent: ent,
						removed: remove_list,
						changed: change_list
					};
					list.push(info);
					next();
				});
			} else {
				setImmediate(next); //nothing to do
			}
		}, function () {
			cb();
		});
	});
};

var fixRelations = function (cb) {
	api.rels(function (err, rels) {
		if (err) return fn(err);
		async.forEachSeries(rels, function (rel, next) {
			var remove_list = [];
			var change_list = [];

			checkFieldsByFormat(rel.data, remove_list, change_list);
			filterDupFields(rel.data, remove_list);

			if (remove_list.length > 0) {
				rel.data = rel.data.filter(function (d) {
					return remove_list.indexOf(d) < 0;
				});
			}

			if (remove_list.length + change_list.length > 0) {
				api.rel_store(rel, function (err) {
					if (err) console.log(err);
					var info = {
						rel: rel,
						removed: remove_list,
						changed: change_list
					};
					list.push(info);
					next();
				});
			} else {
				setImmediate(next); //nothing to do
			}
		}, function () {
			cb();
		});
	});
};

fixEntities(function () {
	fixRelations(function () {
		console.log(list);
		if (list.length > 0) {
			var filename = './cleanup-log-' + (new Date()).valueOf() + '.json';
			fs.writeFileSync(path.resolve(__dirname, filename), JSON.stringify(list, null, '\t'));
		}
		process.exit();
	});
});
