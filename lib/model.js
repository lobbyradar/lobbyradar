var model = {};

var emptyOrNull = function (s) {
	return s == null || (s.length == 0);
};

var is = function (val, type) {
	return typeof val == type;
};

model.format_spec = {
	'string': {
		validate: function (val) {
			return is(val, 'string') && !emptyOrNull(val);
		}
	},
	'url': {
		validate: function (val) {
			return is(val, 'string') && !emptyOrNull(val);
		}
	},
	'date': {
		validate: function (val) {
			return val !== null;
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
			return is(val, 'object') && !emptyOrNull(val.url);
		}
	},
	'range': {
		validate: function (val) {
			return is(val, 'object') && !(
					emptyOrNull(val.start_day)
					&& emptyOrNull(val.start_month)
					&& emptyOrNull(val.start_year)
					&& emptyOrNull(val.end_day)
					&& emptyOrNull(val.end_month)
					&& emptyOrNull(val.end_year)
					&& emptyOrNull(val.desc)
					&& emptyOrNull(val.source)
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
	'monthyear': {
		validate: function (val) {
			return is(val, 'object') && !(
					isNaN(parseInt(val.year, 10)) && isNaN(parseInt(val.month, 10))
				);
		}
	},
	'photo': {
		validate: function (val) {
			return is(val, 'object') && !(
					emptyOrNull(val.url) && emptyOrNull(val.copyright)
				);
		}
	},
	'address': {
		validate: function (val) {
			return is(val, 'object') && !(
					emptyOrNull(val.country) &&
					emptyOrNull(val.postcode) &&
					emptyOrNull(val.city) &&
					emptyOrNull(val.www) &&
					emptyOrNull(val.name) &&
					emptyOrNull(val.email) &&
					emptyOrNull(val.addr)
				);
		}
	},
	'activity': {
		validate: function (val) {
			return is(val, 'object') && !(
					emptyOrNull(val.type) &&
					emptyOrNull(val.year) &&
					emptyOrNull(val.begin) &&
					emptyOrNull(val.end) &&
					emptyOrNull(val.periodical) &&
					emptyOrNull(val.position) &&
					emptyOrNull(val.place) &&
					emptyOrNull(val.activity)
				);
		}
	}
};

module.exports = model;