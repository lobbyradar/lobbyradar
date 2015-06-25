var db = require("./db.js");
var utils = require("../lib/utils.js");

/* filter out duplicate data fields */

var filterDupFields = function (data, state) {
	var length = data.length;
	for (var i = 0; i < length; i++) {
		var d = data[i];
		for (var j = i + 1; j < length; j++) {
			var d2 = data[j];
			if (utils.fields_equal(d, d2)) {
				state.removed('duplicate value', d2);
			}
		}
	}
};

var filterDupFieldsEntity = function (ent, state) {
	filterDupFields(ent.data, state);
};

var filterDupFieldsRel = function (rel, state) {
	filterDupFields(rel.data, state);
};

db.run('Fix Duplicate Fields',[filterDupFieldsEntity], [filterDupFieldsRel]);
