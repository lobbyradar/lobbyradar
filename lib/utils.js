var path = require("path");
var slug = require("slug");
var crypto = require("crypto");
var debug = require("debug")("utils");

var utils = {};

utils.fields_equal = function (f1, f2) {
	if ((f1.key !== f2.key) || (f1.auto !== f2.auto) || (f1.desc !== f2.desc) || (f1.format !== f2.format)) {
		//console.log('basics not equal', f1, f2);
		return false;
	}
	if (typeof f1.value !== typeof f2.value) {
		//console.log('data types not equal', f1, f2);
		return false;
	}
	switch (typeof f1.value) {
		case 'string':
		case 'number':
			return f1.value == f2.value;
			break;
		case 'object':
			var keys = Object.keys(f1.value);
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];
				if (f1.value[key] !== f2.value[key]) {
					//console.log('sub values not equal', f1, f2, key);
					return false;
				}
			}
			break;
		default:
			//console.log('compare todo type', typeof f1.value, typeof f1.value);
			return false;
			break;
	}
	return true;
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