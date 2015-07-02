var util = require('util');
var model = {};

var hasValue = function (val) {
	if (val == null) return false;
	if (val == undefined) return false;
	if (typeof val == "string") return val.length > 0;
	return true;
};

var is = function (val, type) {
	return typeof val == type;
};

model.format_spec = {
	'string': {
		validate: function (val) {
			return is(val, 'string') && hasValue(val);
		}
	},
	'url': {
		validate: function (val) {
			return is(val, 'string') && hasValue(val);
		}
	},
	'date': {
		validate: function (val) {
			return ((val !== null) && is(val, 'object') &&
			(util.isDate(val) || val.date));
		}
	},
	'bool': {
		validate: function (val) {
			return val !== null;
		}
	},
	'number': {
		validate: function (val) {
			return !isNaN(val);
		}
	},
	'integer': {
		validate: function (val) {
			return !isNaN(val);
		}
	},
	'link': {
		validate: function (val) {
			return is(val, 'object') && hasValue(val.url);
		}
	},
	'range': {
		validate: function (val) {
			return is(val, 'object') &&
				(
					(
						(hasValue(val.start) && (hasValue(val.start.year) || hasValue(val.start.month) || hasValue(val.start.day))) ||
						hasValue(val.start_year) || hasValue(val.start_month) || hasValue(val.start_day)
					) ||
					(
						(hasValue(val.end) && (hasValue(val.end.year) || hasValue(val.end.month) || hasValue(val.end.day))) ||
						hasValue(val.end_year) || hasValue(val.end_month) || hasValue(val.end_day)
					) ||
					hasValue(val.desc) ||
					hasValue(val.source)
				);
		}
	},
	'donation': {
		validate: function (val) {
			return is(val, 'object') && !(
					isNaN(parseInt(val.year, 10)) && isNaN(parseInt(val.amount, 10))
				);
		}
	},
	'association': {
		validate: function (val) {
			return is(val, 'object') && (
					(hasValue(val.start) && (hasValue(val.start.year) || hasValue(val.start.month) || hasValue(val.start.day))) ||
					(hasValue(val.end) && (hasValue(val.end.year) || hasValue(val.end.month) || hasValue(val.end.day))) ||
					hasValue(val.sources) ||
					hasValue(val.desc) ||
					hasValue(val.position) ||
					hasValue(val.verified) ||
					hasValue(val.type)
				);
		}
	},
	'donation': {
		validate: function (val) {
			return is(val, 'object') && (
				hasValue(val.amount) ||
				hasValue(val.sources) ||
				hasValue(val.desc) ||
				hasValue(val.verified) ||
				hasValue(val.type)
			);
		}
	},
	'monthyear': {
		validate: function (val) {
			return is(val, 'object') && !(
					isNaN(parseInt(val.year, 10)) && isNaN(parseInt(val.month, 10))
				);
		}
	},
	'photo': {
		validate: function (val) {
			return is(val, 'object') && (
					hasValue(val.url) || hasValue(val.copyright)
				);
		}
	},
	'address': {
		validate: function (val) {
			return is(val, 'object') && (
					hasValue(val.country) ||
					hasValue(val.postcode) ||
					hasValue(val.city) ||
					hasValue(val.www) ||
					hasValue(val.name) ||
					hasValue(val.email) ||
					hasValue(val.addr)
				);
		}
	},
	'activity': {
		validate: function (val) {
			return is(val, 'object') && (
					hasValue(val.type) ||
					hasValue(val.start) ||
					hasValue(val.year) ||
					hasValue(val.begin) ||
					hasValue(val.end) ||
					hasValue(val.periodical) ||
					hasValue(val.position) ||
					hasValue(val.place) ||
					hasValue(val.activity)
				);
		}
	}
};

module.exports = model;