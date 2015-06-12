var path = require("path");
var slug = require("slug");
var mongojs = require("mongojs");

var utils = {};

utils.entity_specs = {
	'update_id': function (val, entity) {
		entity.update_id = val;
	},
	'name': function (val, entity) {
		entity.name = val;
	},
	'url': function (val, entity) {
		if ((typeof val === "string") && (val !== "")) {
			entity.data.push({
				"key": "url",
				"value": val,
				"desc": "URL",
				"format": "url"
			});
		}
	},
	'staff': function (val, entity) {
		var num = parseInt(val, 10);
		if ((typeof num === "number") && !isNaN(num)) {
			entity.data.push({
				"key": "staff",
				"value": num,
				"desc": "Anzahl der Mitarbeiter",
				"format": "number"
			});
		}
	},
	'notes': function (val, entity) {
		if ((typeof val === "string") && (val !== "")) {
			entity.data.push({
				"key": "notes",
				"value": val,
				"desc": "Notizen",
				"format": "string"
			});
		}
	}
};

utils.relation_specs = {
	'update_id1': function (val, rel) {
		rel.update_id1 = val;
	},
	'update_id2': function (val, rel) {
		rel.update_id2 = val;
	},
	'position': function (val, rel) {
		if ((typeof val === "string") && (val !== "")) {
			rel.data.push({
				"key": "position",
				"value": val,
				"desc": "Position",
				"format": "string"
			});
		}
	},
	'range': function (val, rel) {
		if (val && (val.start || val.end)) {
			rel.data.push({
				"key": "range",
				"value": {
					start: val.start ? val.start.valueOf() : null,
					end: val.end ? val.end.valueOf() : null,
					format: val.format ? val.format : 'yyyy'
				},
				"desc": "Datumbereich",
				"format": "range"
			});
		}
	},
	'notes': function (val, entity) {
		if ((typeof val === "string") && (val !== "")) {
			entity.data.push({
				"key": "notes",
				"value": val,
				"desc": "Notizen",
				"format": "string"
			});
		}
	}
};

utils.validateDataField = function (field) {
	field.auto = true;
	field.created = (new Date());
	field.updated = (new Date());
};

utils.validateEntity = function (entity) {
	entity.created = (new Date());
	entity.updated = (new Date());
	entity.data.forEach(utils.validateDataField);
};

utils.validateRelation = function (rel) {
	rel.created = (new Date());
	rel.updated = (new Date());
	rel.data.forEach(utils.validateDataField);
};

utils.submit = function (intermed, cb) {
	var config = require(path.resolve(__dirname, "../config.js"));
	var db = mongojs(config.db, ["entities", "relations", "users", "update", "fields", "dataindex"]);
	var api = require(path.resolve(__dirname, "../lib/api.js"))(config.api, db);
	api.update_store(intermed, cb);
};

module.exports = utils;