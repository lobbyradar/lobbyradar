var util = require('util');
var db = require("./db.js");

if (!util.isString) {
	util.isString = function(s){
		return typeof s == 'string';
	}
}

var entities = {};

var getSplitDate = function (date) {
	date = new Date(date);
	var result = {day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear()};
	return result;
};

var getSplitDateField = function (d) {
	if (d.format == 'monthyear') return d.value;
	if (d.format == 'date') {
		if (util.isDate(d.value)) {
			return getSplitDate(d.value);
		} else if (util.isDate(d.value.date)) {
			var date = getSplitDate(d.value.date);
			if (d.value.fmt == 'yyyy') {
				delete date.month;
				delete date.day;
			}
			if (d.value.fmt == 'MM.yyyy') {
				delete date.day;
			}
			return date;
		} else if (d.value.year) {
			return d.value;
		}
	}
	console.log('invalid date value', d);
	return null;
};

var buildGeneric = function (rel, obj, state) {

	function getData(key, pos) {
		return rel.data.filter(function (d) {
			return d.key == key;
		})[pos || 0];
	}

	var d = getData('verified');
	if (d) {
		obj.value.verified = d.value;
		state.removed('merged value', d);
	}
	var d = getData('issued');
	if (d) {
		obj.value.desc = d.value;
		state.removed('merged value', d);
	}
	d = getData('source', 0);
	if (d) {
		obj.value.sources = obj.value.sources || [];
		obj.value.sources.push(d.value.url);
		if (d.value.remark) obj.importer = d.value.remark;
		state.removed('merged value', d);
	}
	d = getData('source', 1); //check multiple sources
	if (d) {
		obj.value.sources = obj.value.sources || [];
		obj.value.sources.push(d.value.url);
		if (d.value.remark) obj.importer = d.value.remark;
		state.removed('merged value', d);
	}
	d = getData('position');
	if (d) {
		obj.value.position = d.value;
		state.removed('merged value', d);
	}
	d = getData('end');
	if (d) {
		var split = getSplitDateField(d);
		if (split) obj.value.end = split;
		state.removed('merged value', d);
	}
	d = getData('start');
	if (d) {
		var split = getSplitDateField(d);
		if (split) obj.value.start = split;
		state.removed('merged value', d);
	}
	d = getData('begin');
	if (d) {
		var split = getSplitDateField(d);
		if (split) obj.value.start = split;
		state.removed('merged value', d);
	}
	return obj;
};

var convertAllActivities = function (rel, state) {
	rel.data.forEach(function (d) {
		if (d.format == 'activity') {
			var changes = {};
			if (d.value.begin) {
				changes.start = getSplitDate(d.value.begin);
				changes.changed = true;
			} else if (d.value.begin === null) {
				changes.changed = true;
			}
			if (d.value.end) {
				if (util.isDate(d.value.end) || util.isString(d.value.end)) {
					changes.end = getSplitDate(d.value.end);
					changes.changed = true;
				}
			}
			if (d.value.year) {
				if (!changes.end) {
					changes.end = {year: d.value.year};
					changes.changed = true;
				}
				if (!changes.start) {
					changes.start = {year: d.value.year};
					changes.changed = true;
				}
			} else if (d.value.year === null) {
				changes.changed = true;
			}
			if (d.value.type) {
				changes.desc = d.value.type;
				changes.changed = true;
			} else if (d.value.type === null) {
				changes.changed = true;
			}
			if (changes.changed) {
				state.changed('activity dates format change', d);
				d.value.start = changes.start;
				d.value.end = changes.end;
				d.value.desc = changes.desc;
				delete d.value.type;
				delete d.value.begin;
				delete d.value.year;
			}
		}
	});
};

var addData = function (d, rel, state) {
	if (!d.value.sources) {
		var e1 = entities[rel.entities[0]];
		var e2 = entities[rel.entities[1]];
		var sources = [];
		if (e1 && e1.type == 'person') e1.data.forEach(function (d1) {
			if (d1.key == 'source') sources.push(d1);
		});
		if (e2 && e2.type == 'person') e2.data.forEach(function (d2) {
			if (d2.key == 'source') sources.push(d2);
		});
		var done = false;
		sources.forEach(function (sd) {
			if (done) return;
			if (sd.value.remark == 'created by bundestag importer') {
				if ((['government', 'member'].indexOf(d.value.type) >= 0) && (sd.value.url.indexOf('http://www.bundestag.de') >= 0)) {
					d.value.sources = d.value.sources || [];
					d.value.sources.push(sd.value.url);
					done = true;
				}
				//else
				//		console.log(d.value.type, e1.name, e2.name, sd.value.url);
			}
			else if (sd.value.remark == 'created by parteispenden importer') {
				//console.log(d.value.type, e1.name, e2.name, sd.value.url);
			}
			//else
			//	console.log(sd.value.remark, e1.name, e2.name, sd.value.url);
		});

		//console.log(sources);
	}
	rel.data.push(d);
	state.added('merged value', d);
};

var convertFieldsMember = function (rel, state) {

	function build() {
		return {
			key: 'association',
			format: 'association',
			desc: 'Verbindung',
			importer: rel.importer,
			value: {type: 'member', position: 'Mitglied'}
		};
	}

	function getData(key, pos) {
		return rel.data.filter(function (d) {
			return d.key == key;
		})[pos || 0];
	}

	var idd = dataFingerPrint(rel.data);
	switch (idd) {
		case '':
		case 'activity':
		case 'source':
		case 'verified':
		case 'position':
		case 'start':
		case 'end':
		case 'source - start':
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
			addData(buildGeneric(rel, build(), state), rel, state);
			break;
		case 'position - position - position':
		case 'position - position':
			for (var i = 0; i < rel.data.length; i++) {
				var d = getData('position', i);
				if (d) {
					var job = build();
					job.value.position = d.value;
					addData(job, rel, state);
					state.removed('merged value', d);
				}
			}
			break;
		case 'end - position - position': //special 54c71eb5349d25992bca57c7 ende gilt für beide positionen
			var jobs = [];
			for (var i = 0; i < rel.data.length; i++) {
				var d = getData('position', i);
				if (d) {
					var job = build();
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
				addData(job, rel, state);
			});
			break;
		case 'donation - source':
		case 'activity - activity - donation - source':
			var job = build();
			var donation = getData('donation');
			var source = getData('source');
			if (source.value.remark.indexOf('Bundestag Spenden') == 0) {
				donation.value.sources = [source.value.url];
				donation.value.desc = source.value.remark;
			} else {
				console.log('activity - activity - donation - source', 'fail');
			}
			addData(job, rel, state);
			state.removed('merged value', source);
			break;
		case 'donation - source - source':
			var job = build();
			var donation = getData('donation').value;
			var source1 = getData('source', 0);
			var source2 = getData('source', 1);
			var source = source1;
			if (source1.value.remark.indexOf('Bundestag Spenden') !== 0) source = source2;
			if (source.value.remark.indexOf('Bundestag Spenden') == 0) {
				donation.sources = [source.value.url];
				donation.desc = source.value.remark;
			} else {
				console.log('donation - source - source', 'fail');
			}
			source = source1;
			if (source.value.remark.indexOf('created by seitenwechsler importer') !== 0) source = source2;
			if (source.value.remark.indexOf('created by seitenwechsler importer') == 0) {
				job.value.sources = [source.value.url];
				job.importer = source.value.remark;
			} else {
				console.log('donation - source - source', 'fail');
			}
			state.removed('merged value', source1);
			state.removed('merged value', source2);
			addData(job, rel, state);
			break;
		default:
			console.log('member - unknown fingerprint', rel._id, idd);
	}

};

var convertFieldsCommittee = function (rel, state) {

	function build() {
		return {
			key: 'association',
			format: 'association',
			desc: 'Verbindung',
			importer: rel.importer,
			value: {type: 'committee'}
		};
	}

	var idd = dataFingerPrint(rel.data);
	switch (idd) {
		case '':
			addData(build(), rel, state);
			break;
		case 'source':
		case 'source - start':
		case 'position - source':
			addData(buildGeneric(rel, build(), state), rel, state);
			break;
		default:
			console.log('committee - unknown fingerprint', rel._id, idd);
	}

};

var convertFieldsPosition = function (rel, state, def_position) {

	function build() {
		var result = {
			key: 'association',
			format: 'association',
			desc: 'Verbindung',
			importer: rel.importer,
			value: {type: 'job', position: 'Arbeitsverhältnis'}
		};
		if (def_position) result.position = def_position;
		return result;
	}

	function getData(key, pos) {
		return rel.data.filter(function (d) {
			return d.key == key;
		})[pos || 0];
	}

	var idd = dataFingerPrint(rel.data);
	switch (idd) {
		case '':
		case 'position':
		case 'begin - source':
		case 'source':
		case 'end - position - start - verified':
		case 'begin - end - position - source':
		case 'end - position':
		case 'end - source':
		case 'position - source - start - verified':
		case 'begin - end - source':
		case 'begin - position - source':
		case 'begin - end - position':
		case 'begin - position':
		case 'position - start':
		case 'position - source':
		case 'position - source - start':
		case 'end - source - start':
		case 'end - position - source':
		case 'end - position - start':
		case 'end - position - source - start':
			addData(buildGeneric(rel, build(), state), rel, state);
			return;
			break;
		case 'position - position - position':
		case 'position - position':
			for (var i = 0; i < rel.data.length; i++) {
				var d = getData('position', i);
				if (d) {
					var job = build();
					job.value.position = d.value;
					addData(job, rel, state);
					state.removed('merged value', d);
				}
			}
			break;
		case 'begin - begin - position - position - source':
			for (var i = 0; i < 2; i++) {
				var job = build();
				var d = getData('position', i);
				var begin = getData('begin', i);
				var source = getData('source');
				var splitdate = getSplitDateField(begin);
				if (splitdate) job.value.start = splitdate;
				job.importer = source.remark;
				job.value.sources = [source.value.url];
				state.removed('merged value', d);
				state.removed('merged value', begin);
				state.removed('merged value', source);
				addData(job, rel, state);
			}
			break;
		default:
			console.log('position - unknown fingerprint', rel._id, idd);
	}
};

var convertFieldsActivity = function (rel, state) {

	function getData(key, pos) {
		return rel.data.filter(function (d) {
			return d.key == key;
		})[pos || 0];
	}

	function build() {
		return {
			key: 'association',
			format: 'association',
			desc: 'Verbindung',
			importer: rel.importer,
			value: {type: 'job', position: 'Arbeitsverhältnis'}
		};
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
			addData(buildGeneric(rel, build(), state), rel, state);
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
			buildGeneric(rel, job, state);
			return;
			break;
		case 'start':
		case 'source':
			addData(buildGeneric(rel, {
				key: 'association',
				format: 'association',
				desc: 'Verbindung',
				importer: rel.importer,
				value: {type: 'member', position: 'Mitglied'}
			}, state), rel, state);
			return;
			break;
		default:
			console.log('activity - unknown fingerprint', rel._id, idd, rel.importer);
	}

};

var convertFieldsSubsidiary = function (rel, state) {

	function build() {
		return {
			key: 'association',
			format: 'association',
			desc: 'Verbindung',
			importer: rel.importer,
			value: {type: 'subsidiary', position: ''}
		};
	}

	var idd = dataFingerPrint(rel.data);
	switch (idd) {
		case '':
			addData(build(), rel, state);
			break;
		case 'source':
		case 'position':
		case 'verified':
		case 'source - verified':
		case 'position - source - start - verified':
		case 'position - source':
			addData(buildGeneric(rel, build(), state), rel, state);
			break;
		default:
			console.log('subsidiary - unknown fingerprint', rel._id, idd, rel.importer);
	}

};

var convertFieldsBusiness = function (rel, state) {

	function build() {
		return {
			key: 'association',
			format: 'association',
			desc: 'Verbindung',
			importer: rel.importer,
			value: {type: 'business', desc: 'Geschäftsverbindung'}
		};
	}

	var idd = dataFingerPrint(rel.data);
	switch (idd) {
		case '':
			addData(build(), rel, state);
			break;
		case 'source':
		case 'position':
		case 'position - source - verified':
		case 'source - start':
		case 'source - verified':
		case 'position - source':
			addData(buildGeneric(rel, build(), state), rel, state);
			break;
		default:
			console.log('business - unknown fingerprint', rel._id, idd, rel.importer);
	}

};

var convertFieldsConsulting = function (rel, state) {

	function buildAssociation() {
		return {
			key: 'association',
			format: 'association',
			desc: 'Verbindung',
			importer: rel.importer,
			value: {type: 'participant', position: 'Teilnehmer'}
		};
	}

	function build() {
		return {
			key: 'association',
			format: 'association',
			desc: 'Verbindung',
			importer: rel.importer,
			value: {type: 'job', position: 'Berater'}
		};
	}

	var idd = dataFingerPrint(rel.data);
	if (rel.entities.map(function (s) {
			return s.toString();
		}).indexOf('555c8fedfcca23362548636a') >= 0) {

		switch (idd) {
			case 'position - source':
			case 'position - verified':
			case 'position - source - source':
			case 'position - source - verified':
				addData(buildGeneric(rel, buildAssociation(), state), rel, state);
				break;
			default:
				console.log('consulting - unknown fingerprint', rel._id, idd, rel.importer);
				break;
		}
		return;
	}

	switch (idd) {
		case 'source':
		case 'source - verified':
			addData(buildGeneric(rel, buildAssociation(), state), rel, state);
			break;
		case 'end - position - source - start':
		case 'start':
		case 'position':
		case 'position - source':
			addData(buildGeneric(rel, build(), state), rel, state);
			break;
		default:
			console.log('consulting - unknown fingerprint', rel._id, idd, rel.importer);
	}

};

var convertFieldsHausausweise = function (rel, state) {

	function build() {
		return {
			key: 'association',
			format: 'association',
			desc: 'Verbindung',
			importer: rel.importer,
			value: {type: 'pass', position: 'Hausausweise'}
		};
	}

	var idd = dataFingerPrint(rel.data);
	switch (idd) {
		case '':
			addData(build(), rel, state);
			break;
		case 'issued':
			addData(buildGeneric(rel, build(), state), rel, state);
			break;
		default:
			console.log('hausausweise - unknown fingerprint', rel._id, idd, rel.importer);
	}

};

var convertFieldsSponsoring = function (rel, state) {

	function build() {
		return {
			key: 'association',
			format: 'association',
			desc: 'Verbindung',
			importer: rel.importer,
			value: {type: 'sponsoring', position: 'Sponsor'}
		};
	}

	var idd = dataFingerPrint(rel.data);
	switch (idd) {
		case '':
		case 'source':
		case 'position - source':
			addData(buildGeneric(rel, build(), state), rel, state);
			break;
		default:
			console.log('sponsoring - unknown fingerprint', rel._id, idd, rel.importer);
	}

};

var convertFieldsAssociation = function (rel, state) {

	function build() {
		return {
			key: 'association',
			format: 'association',
			desc: 'Verbindung',
			importer: rel.importer,
			value: {type: '', position: 'Assoziiert'}
		};
	}

	var idd = dataFingerPrint(rel.data);
	switch (idd) {
		case '':
			addData(build(), rel, state);
			break;
		case 'source':
		case 'position':
		case 'position - source':
			addData(buildGeneric(rel, build(), state), rel, state);
			break;
		default:
			console.log('association - unknown fingerprint', rel._id, idd, rel.importer);
	}

};

var convertFieldsGovernment = function (rel, state) {

	function getData(key, pos) {
		return rel.data.filter(function (d) {
			return d.key == key;
		})[pos || 0];
	}

	function getDataList(key) {
		return rel.data.filter(function (d) {
			return d.key == key;
		});
	}

	function build() {
		return {
			key: 'association',
			format: 'association',
			desc: 'Verbindung',
			importer: rel.importer,
			value: {type: 'government', position: 'Politische Position'}
		};
	}

	var idd = dataFingerPrint(rel.data);
	switch (idd) {
		case 'position':
		case 'end - position - source - start':
		case 'position - source - verified':
		case 'position - start':
		case 'position - source - start':
		case 'position - source':
		case 'end - position - start':
		case 'begin - end - position':
		case 'begin - position':
			addData(buildGeneric(rel, build(), state), rel, state);
			return;
			break;
		case 'position - position - position':
		case 'position - position':
			for (var i = 0; i < rel.data.length; i++) {
				var d = getData('position', i);
				if (d) {
					var job = build();
					job.value.position = d.value;
					addData(job, rel, state);
					state.removed('merged value', d);
				}
			}
			break;
		case 'begin - begin - begin - end - end - end - position':
		case 'begin - begin - end - position':
		case 'begin - begin - end - end - position':
		case 'begin - begin - begin - end - end - position':
			var begin = getDataList('begin');
			if (begin.length == 0) begin = getDataList('start');
			var end = getDataList('end');
			var position = getData('position');
			begin.sort(function (a, b) {
				if (a.value.date > b.value.date) return -1;
				if (a.value.date < b.value.date) return 1;
				return 0;
			});
			end.sort(function (a, b) {
				if (a.value.date > b.value.date) return -1;
				if (a.value.date < b.value.date) return 1;
				return 0;
			});
			var matched = {};
			begin.forEach(function (b) {
				var matching = end.filter(function (e) {
					return (!matched[e.id]) && (e.value.date > b.value.date);
				});
				if (matching.length == 1) {
					var e = matching[0];
					matched[e.id] = true;
					matched[b.id] = true;
					var job = build();
					job.value.position = position.value;
					var splitdate = getSplitDateField(b);
					if (splitdate) job.value.start = splitdate;
					splitdate = getSplitDateField(e);
					if (splitdate) job.value.end = splitdate;
					state.removed('merged value', b);
					state.removed('merged value', e);
					state.removed('merged value', position);
					addData(job, rel, state);
				}
			});
			begin = begin.filter(function (b) {
				return (!matched[b.id])
			});
			end = end.filter(function (b) {
				return (!matched[b.id])
			});
			if (begin.length == 1 && end.length == 1) {
				var job = build();
				job.value.position = position.value;
				var splitdate = getSplitDateField(begin[0]);
				if (splitdate) job.value.start = splitdate;
				splitdate = getSplitDateField(end[0]);
				if (splitdate) job.value.end = splitdate;
				state.removed('merged value', begin[0]);
				state.removed('merged value', end[0]);
				state.removed('merged value', position);
				addData(job, rel, state);
				return;
			}
			if (begin.length == 1 && end.length == 0) {
				var job = build();
				job.value.position = position.value;
				var splitdate = getSplitDateField(begin[0]);
				if (splitdate) job.value.start = splitdate;
				state.removed('merged value', begin[0]);
				state.removed('merged value', position);
				addData(job, rel, state);
				return;
			}
			if (begin.length == 0 && end.length == 1) {
				var job = build();
				job.value.position = position.value;
				var splitdate = getSplitDateField(end[0]);
				if (splitdate) job.value.end = splitdate;
				state.removed('merged value', end[0]);
				state.removed('merged value', position);
				addData(job, rel, state);
				return;
			}
			if (begin.length + end.length !== 0) {
				console.log('gov - date mismatch', idd, begin.length, end.length);
				return;
			}
			break;
		default:
			console.log('government - unknown fingerprint', rel._id, idd, rel.importer);
			break;
	}

};

var convertFieldsExecutive = function (rel, state) {

	var build = function () {
		return {
			key: 'association',
			format: 'association',
			desc: 'Verbindung',
			importer: rel.importer,
			value: {type: 'executive', position: 'Vorstand'}
		};
	};

	var idd = dataFingerPrint(rel.data);
	switch (idd) {
		case '':
		case 'source':
		case 'position':
		case 'end - position - source - verified':
		case 'position - source - start - verified':
		case 'end - position - source - start - verified':
		case 'begin - end - position - source':
		case 'end - position - source':
		case 'end - position - source - start':
		case 'end - position - start':
		case 'end - start':
		case 'position - source - start':
		case 'position - start':
		case 'source - verified':
		case 'position - source - verified':
		case 'end - source - start':
		case 'end - source':
		case 'begin - position - source':
		case 'position - source':
		case 'source - start':
		case 'activity - source':
			addData(buildGeneric(rel, build(), state), rel, state);
			break;
		default:
			console.log('executive - unknown fingerprint', rel._id, idd, rel.importer);
	}
};

var convertFieldsDonation = function (rel, state) {

	function getDataList(key) {
		return rel.data.filter(function (d) {
			return d.key == key;
		});
	}

	var donations = getDataList('donation');
	var sources = getDataList('source');
	if (sources.length == 0) {
		return;
	}
	if (sources.length == 1) {
		donations.forEach(function (donation) {
			buildGeneric(rel, donation, state);
		});
		return;
	}
	sources.forEach(function (source) {
		state.removed('merged value', source);
	});
	donations.forEach(function (donation) {
		if (donation.value.year == '2013') {
			state.changed('merged value', donation);
			donation.value.sources = ['https://docs.google.com/spreadsheets/d/1caESI467tBJ8uwv0RqjI-3AJYYcrdceJhfRPAtm2yXw/edit?usp=sharing'];
			donation.importer = 'Bundestag Spenden von Personen und Beiträge von Mandatsträgern';
		} else {
			state.changed('merged value', donation);
			donation.value.sources = ['http://apps.opendatacity.de/parteispenden-recherche/assets/data/parteispenden.json'];
			donation.importer = 'Parteispenden';
		}
	});
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

var convertRelationFields = function (rel, state) {
	rel.data.sort(function (a, b) {
		if (a.created < b.created)return -1;
		if (b.created < a.created)return 1;
		return 0;
	});
	var validfingerprints = ['activity', 'donation', 'association'];

	convertAllActivities(rel, state);

	var checkDone = function () {
		var data = rel.data.filter(function (d) {
			return state.remove_data.filter(function (r) {
					return r.data.id == d.id;
				}).length == 0;
		});
		var idd = dataFingerPrint(data, validfingerprints);
		if (idd == '') {
			state.changed_rel = 'converted type ' + rel.type + ' -> general';
			rel.type = 'general';
		}
	};

	if ((rel.type == 'executive') || (rel.type == 'ececutive') || (rel.type == 'Vorsitzender')) {
		checkDone(convertFieldsExecutive(rel, state));
	} else if ((rel.type == 'Mitglied') || (rel.type == 'mitglied') || (rel.type == 'member')) {
		checkDone(convertFieldsMember(rel, state));
	} else if (rel.type == 'activity') {
		checkDone(convertFieldsActivity(rel, state));
	} else if ((rel.type == 'Position') || (rel.type == 'position')) {
		checkDone(convertFieldsPosition(rel, state));
	} else if (rel.type == 'lobbyist') {
		checkDone(convertFieldsPosition(rel, state, 'Lobbyist'));
	} else if ((rel.type == 'subsidiary') || (rel.type == 'subisdiary') || (rel.type == 'Tochterfirma')) {
		checkDone(convertFieldsSubsidiary(rel, state));
	} else if (rel.type == 'business') {
		checkDone(convertFieldsBusiness(rel, state));
	} else if (rel.type == 'consulting') {
		checkDone(convertFieldsConsulting(rel, state));
	} else if (rel.type == 'government') {
		checkDone(convertFieldsGovernment(rel, state));
	} else if (rel.type == 'association') {
		checkDone(convertFieldsAssociation(rel, state));
	} else if (rel.type == 'Hausausweise') {
		checkDone(convertFieldsHausausweise(rel, state));
	} else if (rel.type == 'sponsoring') {
		checkDone(convertFieldsSponsoring(rel, state));
	} else if (rel.type == 'donation') {
		checkDone(convertFieldsDonation(rel, state));
	} else if (rel.type == 'committee') {
		checkDone(convertFieldsCommittee(rel, state));
	}


};

var collectEntities = function (ent, state) {
	entities[ent._id.toString()] = ent;
};

db.run('Convert Relation Fields', [collectEntities], [convertRelationFields]);
