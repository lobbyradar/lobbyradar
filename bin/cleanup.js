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

var emptyOrNull = function (s) {
	return s == null || (s.length == 0);
};

var checkFieldsByFormat = function (data, remove_list, change_list) {
	data.forEach(function (d) {
		if (d.format == 'string') {
			if (emptyOrNull(d.value)) {
				remove_list.push(d);
			} else {
				if (d.value.indexOf('tellvertretend') == 0) {
					change_list.push(clone(d));
					d.value = 'S' + d.value;
				}
				if (d.desc == 'Beschreibungstext') {
					change_list.push(clone(d));
					d.desc = 'Beschreibung';
				}
			}
		} else if (d.format == 'link') {
			if (!d.value || emptyOrNull(d.value.url)) {
				remove_list.push(d);
			} else {
				if (d.key == 'www' || d.key == 'link') {
					change_list.push(clone(d));
					d.key = 'url';
				}
				if (d.desc == 'URL' || d.desc == 'Link') {
					change_list.push(clone(d));
					d.desc = 'Webseite';
				}
				if (d.value && d.value.desc == 'Fraktion undefined') {
					change_list.push(clone(d));
					d.value.remark = 'Fraktion';
				}
			}
		} else if (d.format == 'range') {
			if ((!d.value) || (
					emptyOrNull(d.value.start) &&
					emptyOrNull(d.value.end)
				))
				remove_list.push(d);
		} else if (d.format == 'donation') {
			if ((!d.value) || (
					emptyOrNull(d.value.year) &&
					emptyOrNull(d.value.amount)
				))
				remove_list.push(d);
		} else if (d.format == 'monthyear') {
			if ((!d.value) || (
					emptyOrNull(d.value.year) &&
					emptyOrNull(d.value.month)
				))
				remove_list.push(d);
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
		} else if (d.format == 'activity') {
			if ((!d.value) || (
					emptyOrNull(d.value.type) &&
					emptyOrNull(d.value.year) &&
					emptyOrNull(d.value.begin) &&
					emptyOrNull(d.value.end) &&
					emptyOrNull(d.value.periodical) &&
					emptyOrNull(d.value.position) &&
					emptyOrNull(d.value.place) &&
					emptyOrNull(d.value.activity)
				))
				remove_list.push(d);
		} else if (d.format == 'photo') {
			if (d.value.addr || d.value.email) {
				change_list.push(clone(d));
				d.format = 'address';
				d.desc = 'Adresse';
				d.key = 'address';
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
			else {
				change_list.push(clone(d));
				d.format = 'number';
			}
		} else if (d.format == 'bool') {
		} else {
			console.log('TODO cleanup format validate:', d.format, d.value);
		}
	});
};

var combineStartEndFields = function (data, remove_list, change_list) {
	var starts = [];
	var ends = [];
	for (var i = 0; i < data.length; i++) {
		var d = data[i];
		if (d.key == 'start' || (d.key == 'begin')) starts.push(d);
		else if (d.key == 'end') ends.push(d);
	}
	if (starts.length == 1 && ends.length == 1) {
		var d = starts[0];
		change_list.push(clone(d));
		d.key = 'range';
		d.format = 'range';
		d.desc = 'Zeitraum';
		d.value = {
			start: d.value.date ? d.value.date : d.value,
			end: ends[0].value.date ? ends[0].value.date : ends[0].value,
			fmt: d.fmt ? d.fmt : 'dd.MM.yyyy'
		};
		remove_list.push(ends[0]);
	}
	else if (starts.length > 0 || ends.length > 0) {
		starts.forEach(function (d) {
			change_list.push(clone(d));
			d.key = 'range';
			d.format = 'range';
			d.desc = 'Zeitraum';
			d.value = {
				start: d.value.date ? d.value.date : d.value,
				end: null,
				fmt: d.fmt ? d.fmt : 'dd.MM.yyyy'
			};
		});
		ends.forEach(function (d) {
			var st = starts.filter(function (sd) {
				return (sd.value.start < d.value);
			});
			if (st.length == 1) {
				st[0].value.end = d.value.date ? d.value.date : d.value;
				remove_list.push(d);
			} else {
				change_list.push(clone(d));
				d.key = 'range';
				d.format = 'range';
				d.desc = 'Zeitraum';
				d.value = {
					start: null,
					end: d.value.date ? d.value.date : d.value,
					fmt: d.fmt ? d.fmt : 'dd.MM.yyyy'
				};
			}
		});
	}
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
			combineStartEndFields(ent.data, remove_list, change_list);

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
			cb(ents);
		});
	});
};

var fixRelations = function (entities, cb) {
	var entity_ids = {};
	entities.forEach(function (ent) {
		entity_ids[ent._id.toString()] = true;
	});
	api.rels_full({full: true}, function (err, rels) {
		if (err) return fn(err);
		async.forEachSeries(rels, function (rel, next) {
			if (rel.entities.length !== 2) {
				console.log('relation with invalid entity count, removing relation');
				return api.rel_delete(rel._id, function (err) {
					list.push({
						removed_rel: rel,
						"invalid": "entity_ids.length"
					});
					if (err) return console.log(err);
					return next();
				});
			}

			if (!entity_ids[rel.entities[0].toString()] || !entity_ids[rel.entities[1].toString()]) {
				console.log('relation with invalid entity ids, removing relation');
				return api.rel_delete(rel._id, function (err) {
					list.push({
						removed_rel: rel,
						"invalid": "entity_ids"
					});
					if (err) return console.log(err);
					return next();
				});
			}

			var remove_list = [];
			var change_list = [];

			checkFieldsByFormat(rel.data, remove_list, change_list);
			filterDupFields(rel.data, remove_list);
			combineStartEndFields(rel.data, remove_list, change_list);

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

var clone = function (obj) {
	return JSON.parse(JSON.stringify(obj));
};

var fixFields = function (cb) {

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
		fieldtypes[id] = {mode: mode, format: d.format, key: d.key, name: d.desc}
	};

	var logRelationFieldType = function (d) {
		var id = [d.key, d.format, d.desc, 'relations'].join('|');
		fieldtypes[id] = {mode: 'relations', format: d.format, key: d.key, name: d.desc}
	};

	api.field_list(null, function (err, fields) {
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
					//console.log(JSON.stringify(t));
					var flist = fields.filter(function (f) {
						return ((f.key == t.key) && (f.mode == t.mode) && (f.format == t.format) && (f.name == t.name));
					});
					return (flist.length == 0);
				});
				if (!new_fields.length) return cb();
				console.log(new_fields.length, 'new fields');
				async.forEachSeries(new_fields, function (t, next) {
						console.log('create field', JSON.stringify(t));
						api.field_create(t, next);
					}, cb
				);
			});
		});
	});
};


fixEntities(function (entities) {
	fixRelations(entities, function () {
		if (list.length > 0) {
			console.log(list.length, 'changes');
			var filename = './cleanup-log-' + (new Date()).valueOf() + '.json';
			fs.writeFileSync(path.resolve(__dirname, filename), JSON.stringify(list, null, '\t'));
		}
		fixFields(function () {
			console.log('done');
			process.exit();
		});
	});
});
