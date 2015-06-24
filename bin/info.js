var db = require("./db.js");
var dataFingerPrint = function (data, exclude) {
	exclude = exclude || [];
	var idd = data.filter(function (d) {
		return exclude.indexOf(d.key) < 0;
	}).sort(function (a, b) {
		if (a.key < b.key)return -1;
		if (b.key < a.key)return 1;
		return 0;
	}).map(function (d) {
		return d.key;
	}).join(' - ');
	return idd;
};

var formatFingerPrint = function (d) {
	var type = (typeof d);
	var list = [];
	if (type == 'object') {
		list = Object.keys(d).sort(function (a, b) {
			if (a < b) return -1;
			if (a > b) return 1;
			return 0;
		}).map(function (key) {
			return key + ':' + typeof d[key];
		});
	} else list.push(type);
	return list.join(' - ');
};

var ent_fields_overview = {};
var ent_fields_format_overview = {};
var rel_fields_overview = {};
var rel_fields_format_overview = {};

var entInfos = function (ent, state) {
	ent.data.forEach(function (d) {
		var idd = formatFingerPrint(d.value);
		ent_fields_format_overview[d.format] = ent_fields_format_overview[d.format] || {};
		ent_fields_format_overview[d.format][idd] = (ent_fields_format_overview[d.format][idd] || 0) + 1;
	});
	var idd = dataFingerPrint(ent.data);
	ent_fields_overview[ent.type] = ent_fields_overview[ent.type] || {};
	ent_fields_overview[ent.type][idd] = (ent_fields_overview[ent.type][idd] || 0) + 1;
};

var relInfos = function (rel, state) {
	rel.data.forEach(function (d) {
		var idd = formatFingerPrint(d.value);
		rel_fields_format_overview[d.format] = rel_fields_format_overview[d.format] || {};
		rel_fields_format_overview[d.format][idd] = (rel_fields_format_overview[d.format][idd] || 0) + 1;
	});
	var idd = dataFingerPrint(rel.data);
	rel_fields_overview[rel.type] = rel_fields_overview[rel.type] || {};
	rel_fields_overview[rel.type][idd] = (rel_fields_overview[rel.type][idd] || 0) + 1;
};

db.run([entInfos], [relInfos], function () {
	console.log('----- ----- ----- ----- ----- -----');
	console.log('Entities - Fields-Overview', ent_fields_overview);
	console.log('----- ----- ----- ----- ----- -----');
	console.log('Entities - Format-Overview', ent_fields_format_overview);
	console.log('----- ----- ----- ----- ----- -----');
	console.log('----- ----- ----- ----- ----- -----');
	console.log('Relations - Fields-Overview', rel_fields_overview);
	console.log('----- ----- ----- ----- ----- -----');
	console.log('Relations - Format-Overview', rel_fields_format_overview);
	console.log('----- ----- ----- ----- ----- -----');
});
