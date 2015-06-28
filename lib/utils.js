var path = require("path");
var slug = require("slug");
var crypto = require("crypto");
var debug = require("debug")("utils");

var utils = {};

utils.value_in_value = function (v1, v2) {
	switch (typeof v1) {
		case 'string':
		case 'number':
			return v1 == v2;
			break;
		case 'object':
			var keys = Object.keys(v1);
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];
				if (!utils.value_in_value(v1[key], v2[key])) {
					return false;
				}
			}
			return true;
			break;
		default:
			console.log('compare todo type', typeof v1, typeof v2);
			return false;
			break;
	}
	return false;
};

utils.field_in_field = function (f1, f2) {
	if ((f1.key !== f2.key) || (f1.format !== f2.format)) {
		//console.log('basics not equal', f1, f2);
		return false;
	}
	if (typeof f1.value !== typeof f2.value) {
		//console.log('data types not equal', f1, f2);
		return false;
	}
	return utils.value_in_value(f1.value,f2.value);
};

utils.validateDataField = function (field) {
	if (!field.hasOwnProperty('auto')) field.auto = true;
	if (!field.hasOwnProperty('created')) field.created = (new Date());
	if (!field.hasOwnProperty('updated')) field.updated = (new Date());
	if (!field.hasOwnProperty('id')) field.id = crypto.pseudoRandomBytes(32).toString('hex');
};

utils.validateEntity = function (entity) {
	if (!entity.hasOwnProperty('created')) entity.created = (new Date());
	if (!entity.hasOwnProperty('updated')) entity.updated = (new Date());
	if (!entity.hasOwnProperty('data')) entity.data = [];
	entity.data.forEach(utils.validateDataField);
};

utils.validateRelation = function (rel) {
	if (!rel.hasOwnProperty('created')) rel.created = (new Date());
	if (!rel.hasOwnProperty('updated')) rel.updated = (new Date());
	if (!rel.hasOwnProperty('data')) rel.data = [];
	rel.data.forEach(utils.validateDataField);
};

module.exports = utils;