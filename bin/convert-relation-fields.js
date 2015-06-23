var util = require('util');
var db = require("./db.js");

var fields_overview = {};

var getSplitDateField = function (d) {
	if (d.type == 'monthyear') return d.value;
	if (d.type == 'date') {
		if (util.isDate(d.value)) {
			var date = new Date(d.value);
			//TODO: real month or date month here??
			return {day: date.getDay(), month: date.getMonth(), year: date.getFullYear()}
		} else {
			var date = new Date(d.value.date);
			if (d.value.fmt == 'yyyy') {
				return {year: date.getFullYear()}
			}
			if (d.value.fmt == 'MM.yyyy') {
				//TODO: real month or date month here??
				return {month: date.getMonth(), year: date.getFullYear()}
			}
		}
	}
	return null;
};

var convertFieldsExecutive = function (rel, state) {
	var fillJob = function (d, job) {
		switch (d.key) {
			case 'source':
				if (d.format !== 'link') console.log('invalid source field', d.format);
				job.value.source_url = d.value.url;
				state.remove_data.push({reason: 'merged value', data: d});
				return true;
				break;
			case 'position':
				if (d.format !== 'string') console.log('invalid position field');
				job.value.position = d.value;
				state.remove_data.push({reason: 'merged value', data: d});
				return true;
				break;
			case 'verified':
				if (d.format !== 'bool') console.log('invalid verfified field');
				job.value.verified = d.value;
				state.remove_data.push({reason: 'merged value', data: d});
				return true;
				break;
			case 'begin':
			case 'start':
				var split = getSplitDateField(d);
				if (split) job.value.start = split;
				state.remove_data.push({reason: 'merged value', data: d});
				return true;
				break;
			case 'end':
				var split = getSplitDateField(d);
				if (split) job.value.end = split;
				state.remove_data.push({reason: 'merged value', data: d});
				return true;
				break;
			case 'activity': //ignore
			case 'donation': //ignore
			case 'job': //ignore
			case 'displayname': //ignore
				return false;
				break;
			default:
				console.log('unknown job field', rel._id, d.key, d);
				return false;
		}
	};
	rel.data.sort(function (a, b) {
		if (a.created < b.created)return -1;
		if (b.created < a.created)return 1;
		return 0;
	});
	var job = {
		key: 'job',
		type: 'job',
		value: {type: 'executive', position: 'Vorstand'}
	};
	var test = {};
	for (var i = 0; i < rel.data.length; i++) {
		var d = rel.data[i];
		if (test[d.key]) {
			return console.log('resolve dup', rel._id, test[d.key], d);
		}
		test[d.key] = d;
		fillJob(d, job);
	}
	rel.data.push(job);
	state.added_data.push(job);
};

var convertFieldsMember = function (rel, state) {

	function buildJob() {
		var job = {
			key: 'job',
			type: 'job',
			value: {type: 'member', position: 'Mitglied'}
		};
		return job;
	}

	function getData(key, pos) {
		return rel.data.filter(function (d) {
			return d.key == key;
		})[pos || 0];
	}

	function adddata(d) {
		rel.data.push(d);
		state.added('merged value', d);
	}

	var idd = dataFingerPrint(rel.data);
	switch (idd) {
		case 'job':
		case 'activity - job':
		case 'activity - activity - donation - job':
		case 'donation - job':
			//ignore
			break;
		case '':
		case 'activity':
		case 'source':
		case 'verified':
		case 'position':
		case 'start':
		case 'end':
		case 'end - start':
		case 'end - source - start':
		case 'end - position - source - start':
		case 'end - position':
		case 'source - verified':
		case 'position - source':
		case 'position - source - start':
		case 'end - position - start':
		case 'end - source - start - verified':
		case 'end - position - source':
		case 'end - source':
		case 'begin - end - position - source':
			adddata(buildSimpleJob(rel, buildJob(), state));
			break;
		case 'position - position - position':
		case 'position - position':
			for (var i = 0; i < rel.data.length; i++) {
				var d = getData('position', i);
				if (d) {
					var job = buildJob();
					job.value.position = d.value;
					adddata(job);
					state.removed('merged value', d);
				}
			}
			break;
		case 'end - position - position': //special 54c71eb5349d25992bca57c7 ende gilt für beide positionen
			var jobs = [];
			for (var i = 0; i < rel.data.length; i++) {
				var d = getData('position', i);
				if (d) {
					var job = buildJob();
					job.value.position = d.value;
					jobs.push(job);
					state.removed('merged value', d);
				}
			}
			jobs.forEach(function (job) {
				var d = getData('end');
				if (d) {
					var split = getSplitDateField(d);
					if (split) job.value.end = split;
					state.removed('merged value', d);
				}
				adddata(job);
			});
			break;
		case 'donation - source':
		case 'activity - activity - donation - source':
			var job = buildJob();
			var donation = getData('donation').value;
			var source = getData('source');
			if (source.value.remark.indexOf('Bundestag Spenden') == 0) {
				donation.source_url = source.value.url;
				donation.desc = source.value.remark;
			} else {
				console.log('activity - activity - donation - source', 'fail');
			}
			adddata(job);
			state.removed('merged value', source);
			break;
		case 'donation - source - source':
			var job = buildJob();
			var donation = getData('donation').value;
			var source1 = getData('source', 0);
			var source2 = getData('source', 1);
			var source = source1;
			if (source1.value.remark.indexOf('Bundestag Spenden') !== 0) source = source2;
			if (source.value.remark.indexOf('Bundestag Spenden') == 0) {
				donation.source_url = source.value.url;
				donation.desc = source.value.remark;
			} else {
				console.log('donation - source - source', 'fail');
			}
			source = source1;
			if (source.value.remark.indexOf('created by seitenwechsler importer') !== 0) source = source2;
			if (source.value.remark.indexOf('created by seitenwechsler importer') == 0) {
				job.value.source_url = source.value.url;
				job.value.importer = source.value.remark;
			} else {
				console.log('donation - source - source', 'fail');
			}
			state.removed('merged value', source1);
			state.removed('merged value', source2);
			adddata(job);
			break;
		default:
			console.log('unknown fingerprint', rel._id, idd);
	}

};

function buildSimpleJob(rel, job, state) {

	function getData(key, pos) {
		return rel.data.filter(function (d) {
			return d.key == key;
		})[pos || 0];
	}

	var d = getData('verified');
	if (d) {
		job.value.verified = d.value;
		state.removed('merged value', d);
	}
	d = getData('source');
	if (d) {
		job.value.source_url = d.value.url;
		if (d.value.remark) job.value.importer = d.value.remark;
		state.removed('merged value', d);
	}
	d = getData('position');
	if (d) {
		job.value.position = d.value;
		state.removed('merged value', d);
	}
	d = getData('end');
	if (d) {
		var split = getSplitDateField(d);
		if (split) job.value.end = split;
		state.removed('merged value', d);
	}
	d = getData('start');
	if (d) {
		var split = getSplitDateField(d);
		if (split) job.value.start = split;
		state.removed('merged value', d);
	}
	d = getData('begin');
	if (d) {
		var split = getSplitDateField(d);
		if (split) job.value.start = split;
		state.removed('merged value', d);
	}
	return job;
}

var convertFieldsActivity = function (rel, state) {

	function getData(key, pos) {
		return rel.data.filter(function (d) {
			return d.key == key;
		})[pos || 0];
	}

	function buildJob() {
		var job = {
			key: 'job',
			type: 'job',
			value: {type: 'job', position: ''}
		};
		return job;
	}

	function adddata(d) {
		rel.data.push(d);
		state.added('merged value', d);
	}

	var idd = dataFingerPrint(rel.data, ['activity']);
	switch (idd) {
		case '': //everything is fine, go ahead
			return;
			break;
		case 'position':
		case 'end - position - start':
		case 'position - source':
		case 'position - source - verified':
		case 'position - source - start':
		case 'end - position':
		case 'position - start':
		case 'end - position - source - start':
			adddata(buildSimpleJob(rel, buildJob(), state));
			return;
			break;
		default:
			break;
	}
	var idd = dataFingerPrint(rel.data);
	switch (idd) {
		case '': //everything is fine, go ahead
			return;
			break;
		case 'activity - end':
		case 'activity - source':
		case 'activity - end - start':
		 	var job = getData('activity');
			buildSimpleJob(rel, job, state);
			return;
			break;
		default:
			console.log('unknown fingerprint', rel._id, idd, rel.importer);
	}

};

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
//var vals = {};

var convertRelationFields = function (rel, state) {
	//rel.data.forEach(function(d){
	//	if (d.key=='activity') vals[d.value.activity] = true;
	//})


	if (rel.type == 'executive') {
		convertFieldsExecutive(rel, state);
		state.changed_rel = 'converted type ' + rel.type + ' -> general';
		rel.type = 'general';
	} else if (rel.type == 'member') {
		convertFieldsMember(rel, state);
		state.changed_rel = 'converted type ' + rel.type + ' -> general';
		rel.type = 'general';
	} else if (rel.type == 'Mitglied') {
		convertFieldsMember(rel, state);
		state.changed_rel = 'converted type ' + rel.type + ' -> general';
		rel.type = 'general';
	} else if (rel.type == 'activity') {
		convertFieldsActivity(rel, state);
		state.changed_rel = 'converted type ' + rel.type + ' -> general';
		rel.type = 'z-activity';
	}

	var data = rel.data.filter(function (d) {
		return state.remove_data.filter(function (r) {
				return r.data.id == d.id;
			}).length == 0;
	});

	var idd = dataFingerPrint(data);
	fields_overview[rel.type] = fields_overview[rel.type] || {};
	fields_overview[rel.type][idd] = (fields_overview[rel.type][idd] || 0) + 1;
};

db.run([], [convertRelationFields], function () {
	console.log(fields_overview);
	//console.log(vals);
});
