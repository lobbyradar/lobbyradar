var util = require('util');
var path = require('path');
var db = require("./db.js");
var utils = require("../lib/utils.js");
var model = require(path.resolve(__dirname, "../lib/model.js"));

if (!util.isString) {
	util.isString = function(s){
		return typeof s == 'string';
	}
}

/* filter out invalid data fields */

var checkFieldsByFormat = function (data, state) {
	data.forEach(function (d) {
		if (d.format == 'photo') {
			if (d.value.addr || d.value.email) {
				state.changed('fix wrong field type', d);
				d.format = 'address';
				d.desc = 'Adresse';
				d.key = 'address';
			}
		}
		if (d.value === null) {
			return state.removed('invalid value', d);
		}
		if ((typeof d.value === 'string') && (d.value.length == 0)) {
			return state.removed('invalid value', d);
		}
		if (d.format === 'date') {
			if (util.isDate(d.value)) {
				state.changed('unify date format', d);
				d.value = {
					date: d.value,
					fmt: 'dd.MM.yyyy'
				};
			} else if (util.isString(d.value)) {
				state.changed('unify date format', d);
				d.value = {
					date: d.value,
					fmt: 'dd.MM.yyyy'
				};
			}
			var date = new Date(d.value.date);
			if (date.toDateString() == 'Invalid Date') {
				state.removed('invalid date', d);
			} else {
				if (d.value.date.valueOf() !== date.valueOf()) {
					state.changed('unify date format', d);
					d.value.date = date;
				}
			}
		}
		var formatscpec = model.format_spec[d.format];
		if (formatscpec) {
			if (!formatscpec.validate(d.value)) {
				//console.log('invalid field value',d);
				state.removed('invalid value', d);
			}
		} else {
			console.log('unknown format', d.format);
		}
	});
};

var checkFieldsByFormatEntity = function (ent, state) {
	checkFieldsByFormat(ent.data, state);
};

var checkFieldsByFormatRel = function (rel, state) {
	checkFieldsByFormat(rel.data, state);
};

db.run('Fix Invalid Fields', [checkFieldsByFormatEntity], [checkFieldsByFormatRel]);

