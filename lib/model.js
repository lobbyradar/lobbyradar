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
					//TODO check date
					emptyOrNull(val.start) && emptyOrNull(val.end)
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

model.entity_property_specs = {
	'update_id': {
		type: 'property',
		fill: function (val, entity) {
			entity.update_id = val;
		}
	},
	'name': {
		type: 'property',
		fill: function (val, entity) {
			entity.name = val;
		}
	}
};

model.entity_data_specs = {
	'url': {
		type: 'data',
		fill: function (val, entity) {
			if ((typeof val === "string")) {
				if (val.toLowerCase().indexOf('http') !== 0) val = 'http://' + val;
				entity.data.push({
					"key": "url",
					"value": val,
					"desc": "Webseite",
					"format": "url"
				});
			}
		}
	},
	'link': {
		type: 'data',
		fill: function (val, entity) {
			if ((typeof val === "string") && (val !== "")) {
				if (val.toLowerCase().indexOf('http') !== 0) val = 'http://';
				entity.data.push({
					"key": "link",
					"value": {url: val},
					"desc": "Webseite",
					"format": "link"
				});
			}
		}
	},
	'staff': {
		type: 'data',
		fill: function (val, entity) {
			var num = parseInt(val, 10);
			if ((typeof num === "number") && !isNaN(num)) {
				entity.data.push({
					"key": "staff",
					"value": num,
					"desc": "Anzahl der Mitarbeiter",
					"format": "number"
				});
			}
		}
	},
	'notes': {
		type: 'data',
		fill: function (val, entity) {
			if ((typeof val === "string") && (val !== "")) {
				entity.data.push({
					"key": "notes",
					"value": val,
					"desc": "Notizen",
					"format": "string"
				});
			}
		}
	}
};

model.relation_property_specs = {
	'update_id1': {
		type: 'property',
		fill: function (val, rel) {
			rel.update_id1 = val;
		}
	},
	'update_id2': {
		type: 'property',
		fill: function (val, rel) {
			rel.update_id2 = val;
		}
	},
};

model.relation_data_specs = {
	'position': {
		type: 'data',
		fill: function (val, rel) {
			if ((typeof val === "string") && (val !== "")) {
				rel.data.push({
					"key": "position",
					"value": val,
					"desc": "Position",
					"format": "string"
				});
			}
		}
	},
	'range': {
		type: 'data',
		fill: function (val, rel) {
			if (val && (val.start || val.end)) {
				rel.data.push({
					"key": "range",
					"value": {
						start: val.start ? val.start.valueOf() : null,
						end: val.end ? val.envalOf() : null,
						fmt: val.format ? val.format : 'yyyy'
					},
					"desc": "Zeitraum",
					"format": "range"
				});
			}
		}
	},
	'notes': {
		type: 'data',
		fill: function (val, entity) {
			if ((typeof val === "string") && (val !== "")) {
				entity.data.push({
					"key": "notes",
					"value": val,
					"desc": "Notizen",
					"format": "string"
				});
			}
		}
	}
};

module.exports = model;