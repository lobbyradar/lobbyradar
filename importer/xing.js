var XLSX = require('xlsx-extract').XLSX;
var utils = require("../lib/utils.js");
var path = require("path");
var slug = require("slug");
var mongojs = require("mongojs");
var config = require(path.resolve(__dirname, "../config.js"));
var db = mongojs(config.db, ["entities", "relations", "users", "update", "fields", "dataindex"]);
var api = require(path.resolve(__dirname, "../lib/api.js"))(config.api, db);

var xingmap_entities = [
	{type: 'update_id', entity: 0, entity_type: "person"},
	{type: 'name', entity: 0},
	{}, {}, {}, {}, {}, {}, {},  //ignore relation
	{type: 'update_id', entity: 1, entity_type: "entity"},
	{type: 'name', entity: 1},
	{type: 'url', entity: 1},
	{}
];
var xingmap_relation = [
	{type: 'update_id1', rel: 0},
	{},
	{type: 'position'},
	{type: 'range', rel: 0, collect: 'start_month'},
	{type: 'range', rel: 0, collect: 'start_year'},
	{type: 'range', rel: 0, collect: 'end_month'},
	{
		type: 'range', rel: 0, collect: 'end_year', collect_end: function (collect) {
		var result = {};
		result.start = new Date(collect.start_year, collect.start_month - 1, 1);
		if (!collect.start_year) result.start = null;
		result.end = new Date(collect.end_year, collect.end_month - 1, 1);
		if (!collect.end_year) result.end = null;
		result.format = 'yyyy';
		if (collect.start_month && collect.end_month)
			result.format = 'MM.yyyy';
		return result;
	}
	},
	{}, {},
	{type: 'update_id2', rel: 0},
	{},
	{},
	{}
];

utils.entity_specs = {
	'update_id': function (val, entity) {
		entity.update_id = val;
	},
	'name': function (val, entity) {
		entity.name = val;
	},
	'url': function (val, entity) {
		if ((typeof val === "string")) {
			if (val.toLowerCase().indexOf('http') !== 0) val = 'http://' + val;
			entity.data.push({
				"key": "url",
				"value": val,
				"desc": "URL",
				"format": "url"
			});
		}
	},
	'link': function (val, entity) {
		if ((typeof val === "string") && (val !== "")) {
			if (val.toLowerCase().indexOf('http') !== 0) val = 'http://';
			entity.data.push({
				"key": "link",
				"value": {url: val},
				"desc": "Link",
				"format": "link"
			});
		}
	},
	'staff': function (val, entity) {
		var num = parseInt(val, 10);
		if ((typeof num === "number") && !isNaN(num)) {
			entity.data.push({
				"key": "staff",
				"value": num,
				"desc": "Anzahl der Mitarbeiter",
				"format": "number"
			});
		}
	},
	'notes': function (val, entity) {
		if ((typeof val === "string") && (val !== "")) {
			entity.data.push({
				"key": "notes",
				"value": val,
				"desc": "Notizen",
				"format": "string"
			});
		}
	}
};

utils.relation_specs = {
	'update_id1': function (val, rel) {
		rel.update_id1 = val;
	},
	'update_id2': function (val, rel) {
		rel.update_id2 = val;
	},
	'position': function (val, rel) {
		if ((typeof val === "string") && (val !== "")) {
			rel.data.push({
				"key": "position",
				"value": val,
				"desc": "Position",
				"format": "string"
			});
		}
	},
	'range': function (val, rel) {
		if (val && (val.start || val.end)) {
			rel.data.push({
				"key": "range",
				"value": {
					start: val.start ? val.start.valueOf() : null,
					end: val.end ? val.end.valueOf() : null,
					fmt: val.format ? val.format : 'yyyy'
				},
				"desc": "Zeitraum",
				"format": "range"
			});
		}
	},
	'notes': function (val, entity) {
		if ((typeof val === "string") && (val !== "")) {
			entity.data.push({
				"key": "notes",
				"value": val,
				"desc": "Notizen",
				"format": "string"
			});
		}
	}
};

var loadFile = function (parse_map, parse, cb) {
	var result = [];
	new XLSX().extract('./data/xing-miz.xlsx', {ignore_header: 1, sheet_nr: 1}) // or sheet_name or sheet_nr
		.on('sheet', function (sheet) {
			console.log('sheet', sheet);  //sheet is array [sheetname, sheetid, sheetnr]
		})
		.on('row', function (row) {
			result = result.concat(parse(parse_map, row));
		})
		//.on('cell', function (cell) {
		//	console.log('cell', cell); //cell is a value or null
		//})
		.on('error', function (err) {
			console.error('error', err);
		})
		.on('end', function (err) {
			cb(null, result);
		});
};

var skipPositions = [
	'----------',
	'--',
	'-',
	'',
	'_',
	'expat',
	'chef von\'s janze',
	'blogger',
	'daf-lehrerin',
	'forschungshiwi',
	'flugbegleiterin',
	'flugbegleiter langstrecke',
	'ferienjobber',
	'ferialpraktikantin',
	'dozent (nebenberuflich)',
	'ehrenamtlicher wahlbeobachter in kirgisistan',
	'ehrenamtlicher wahlbeobachter in kasachstan',
	'ehrenamtlicher wahlbeobachter in der ukraine',
	'ehrenamtlicher wahlbeobachter in bosnien-herzegowina',
	'ehrenamtlicher wahlbeobachter in aserbaidschan',
	'ehrenamtlicher mitarbeiter',
	'ehrenamtlicher beauftragter für entrepreneurship',
	'ehrenamtliche richterin',
	'ehrenamtliche pr-arbeit / klenk & hoursch ag',
	'doktorandin',
	'doktorand und wiss. mitarbeiter',
	'doktorand biochemie',
	'doktorand',
	'duale studentin',
	'diplomprojekt',
	'diplomandin, praktikantin',
	'diplomandin sustainability operations',
	'diplomandin marketing/vertrieb',
	'diplomandin im bereich entwicklung hydraulik',
	'diplomand/wissenschaftlicher mitarbeiter',
	'diplomand/vertrieb übersee',
	'diplomand und praktikant',
	'diplomand schiffstheorie',
	'diplomand fifa world cup 2006 team',
	'diplomand',
	'journalistenschüler',
	'interviewerin',
	'interviewer',
	'internship; media & communication at german industry and commerce greater china',
	'internship&student trainee: vertrieb und bestandscontrolling',
	'internship&student trainee: corporate communications & public relations',
	'internship consultant strategic planning',
	'internship consultant hr-strategy',
	'internship',
	'internal traineeship',
	'intern communications',
	'intern communicaions',
	'intern - communication department',
	'intern (freiwilligenarbeit)',
	'human resources werkstudentin',
	'human resources praktikantin',
	'netzwerkadministrator',
	'nebenberufliche mitarbeit',
	'pindi kinnisvara, tallinn, estland',
	'phd fellow',
	'praktika',
	'prakt.',
	'marktstudie',
	'mba-masterand',
	'mba- programm',
	'masterstudent der bwl',
	'masters-stipendiat',
	'masterrand',
	'masterarbeit: global product launch',
	'masterandin',
	'master student',
	'lektor',
	'lehrer / erzieher',
	'krankenschwester',
	'krankenkassen-service',
	'kollegiatin',
	'impulsgeberin',
	'genius',
	'host',
	'hiwi',
	'hilfswissenschaftliche angestellte',
	'hilfswissenschaftler',
	'hilfskraft der mobilitätstelle',
	'hilfskraft',
	'praktkantin',
	'praxissemester',
	'promotionsstudium',
	'promotionsstudentin',
	'promotionsstipendiat',
	'promotions-stipendiat',
	'promotion', 'frühjahrspraktikantin',
	'freiwilliges soziales jahr',
	'freiwilligendienst mikrofinanzabteilung',
	'sabbatical',
	'schüler',
	'singer, songwriter & stagediver',
	'soldat (wehrdienst)',
	'studiumbegleitend',
	'studienrichtungsvertretung',
	'studienprojektoffizier im militärischen bereich operations research',
	'studienhospitation',
	'studiengangssprecher b.sc. pflege',
	'studienführer',
	'studienarbeit',
	'tutorin',
	'tutor audiovisuelle kommunikation',
	'tutor & studentischer mitarbeiter',
	'vj',
	'webmaster, tutorin ...',
	'wehrübender',
	'wehrdienstleistender/stabsdienst',
	'wehrdienstleistender / obergefreiter',
	'weltreisende',
	'weiterbildungen',
	'weiterbildung _x001c_fachreferent für presse und pr_x001c_',
	'wehrdienstleistender',
	'webdevelopment',
	'tutor',
	'wisshk',
	'wissenschaftliche hilfskraft: tutor statistik',
	'wissenschaftliche hilfskraft - tutorin',
	'wissenschaftliche hilfskraft (tutor)',
	'wissenschaftliche hilfskraft', 'werkvertrag',
	'werkstudentin,unternehmensberatung-gesundheitswesen',
	'werkstudentin, redaktion',
	'werkstudentin, human resources',
	'werkstudentin personal',
	'werkstudentin marketing',
	'werkstudentin in social media',
	'werkstudentin focus magazin verlag gmbh',
	'werkstudentin bewerbermanagement',
	'werkstudentin / praktikantin',
	'werkstudent/diplomarbeit',
	'werkstudent redaktion',
	'werkstudent public affairs (energiepolitik)',
	'werkstudent online-marketing',
	'werkstudent marketing',
	'werkstudent in der zulassungsabteilung',
	'werkstudent in der presse- und pr-abteilung',
	'werkstudent in der abteilung fes projekteinkauf sportwagen',
	'werkstudent im kommunikationsteam der hauptstadtrepräsentanz',
	'werkstudent im bereich communications',
	'werkstudent fachbereich iv - methodenlehre',
	'werkstudent als verkäufer',
	'werkstudent _x001c_operativer vertrieb & strategische marketingberatung_x001c_',
	'werkstudent / praktikant',
	'werkstudent - buchhaltung',
	'werkstudent (public relations)',
	'werkstudent (corporate communications)',
	'werksstudentin',
	'werksstudent infrastruktur luftseite',
	'werksstudent',
	'veröffentlichungen:',
	'verwaltungspraktikantin',
	'pädagogische hilfskraft',
	'auf der suche nach einer neuen herausforderung',
	'ständiger gast', 'weltreise', 'studentische hilfskraft',
	'studentischer / wissenschaftlicher mitarbeiter',
	'stud. mitarbeiter', 'mba student', '---', 'student', 'bachelorand',
	'intern', 'praktikant', 'praktikantin', 'trainee', 'hospitantin',
	'werkstudentin', 'werkstudent'];

var skipOrgs = [
	'.', '--', '-', '&', '::'
];

var bla = [];
var skipRow = function (row) {
	var val = (row[2] || '').toLowerCase().trim();
	if (val.indexOf('praktikum') >= 0) return true;
	if (val.indexOf('praktikant') >= 0) return true;
	if (val.indexOf('trainee') >= 0) return true;
	if (val.indexOf('volontär') >= 0) return true;
	if (val.indexOf('volunteer') >= 0) return true;
	if (val.indexOf('diplomand') >= 0) return true;
	if (val.indexOf('aushilfe') >= 0) return true;
	if (val.indexOf('student') >= 0) return true;
	if (val.indexOf('stud.') >= 0) return true;
	if (skipPositions.indexOf(val) >= 0) return true;
	var val = (row[10] || '').toLowerCase().trim();
	if (skipOrgs.indexOf(val) >= 0) return true;
	if (bla.indexOf(val) < 0) bla.push(val);
	return false;
};

var validateString = function (val) {
	if (typeof val == 'string') {
		return val
			.replace(/_x001C_/g, '')
			.replace(/_x0013_/g, '')
			.replace(/_x0014_/g, '')
			.replace(/_x0018_Ñ/g, '')
			.replace(/  /g, ' ');
	}
	return val;
};

var parseEntities = function (parse_map, row) {
	if (skipRow(row)) return [];
	var entities = [];
	//console.log(row[2]);
	parse_map.forEach(function (spec, i) {
		if (!spec.type) return; //skip
		entities[spec.entity || 0] = entities[spec.entity || 0] || {data: [], type: spec.entity_type, importer: 'xing'};
		var specparse = utils.entity_specs[spec.type];
		if (!specparse) {
			return console.log('invalid entity spec parse type', spec.type);
		}
		var val = validateString(row[i]);
		specparse(val, entities[spec.entity || 0])
	});
	return entities;
};

var parseRelations = function (parse_map, row) {
	if (skipRow(row)) return [];
	var relations = [];
	var collect = null;
	parse_map.forEach(function (spec, i) {
		var val = validateString(row[i]);
		if (spec.collect) {
			collect = collect || {};
			collect[spec.collect] = val;
			if (!spec.collect_end) return;
			val = spec.collect_end(collect);
			collect = null;
		}
		if (!spec.type) return; //skip
		relations[spec.rel || 0] = relations[spec.rel || 0] || {data: [], type: 'job', importer: 'xing'};
		var specparse = utils.relation_specs[spec.type];
		if (!specparse) {
			return console.log('invalid relation spec parse type', spec.type);
		}
		specparse(val, relations[spec.entity || 0])
	});
	return relations;
};

var validate = function (entities, relations) {
	var hash = {};
	var slugs = {};

	var slugName = function (val) {
		if (typeof val == 'string') {
			var i = val.indexOf(',');
			if (i > 1) {
				val = val.slice(0, i);
			}
			i = val.indexOf('(');
			if (i > 1) {
				val = val.slice(0, i);
			}
			return val
				.replace(/e\. ?V\./g, '')
				.replace(/ UG/g, '')
				.replace(/UG (haftungsbeschränkt)/g, '')
				.replace(/GmbH/g, '')
				.replace(/GmbH & Co\. KG/g, '')
				.replace(/ AG/g, '')
				.replace(/ /g, '').toLowerCase();
		}
		return val;
	};

	var mergedata = function (e, entity) {
		if (e.name !== entity.name) {
			e.aliases = e.aliases || [];
			if (e.aliases.indexOf(entity.name) < 0)
				e.aliases.push(entity.name);
		}
		entity.data.forEach(function (d) {
			var equals = e.data.filter(function (d1) {
				return ((d1.type == d.type) && d1.value == d.value);
			});
			if (equals.length == 0) e.data.push(d);
		});
	};

	entities.forEach(function (entity) {
		if (isNaN(entity.update_id) || !entity.name) return;
		var e = hash[entity.update_id];
		if (e) {
			mergedata(e, entity);
		} else {
			var slug = slugName(entity.name);
			var e = slugs[slug];
			if (e) {
				mergedata(e, entity);
				relations.forEach(function (rel) {
					if (rel.update_id1 == entity.update_id) rel.update_id1 = e.update_id;
					if (rel.update_id2 == entity.update_id) rel.update_id2 = e.update_id;
				});
			} else {
				hash[entity.update_id] = entity;
				slugs[slug] = entity;
			}
		}
	});

	Object.keys(hash).map(function (key) {
		var entity = hash[key];
		utils.validateEntity(entity);
		return entity;
	});

	entities = Object.keys(hash).map(function (key) {
		var entity = hash[key];
		utils.validateEntity(entity);
		return entity;
	});

	return {
		entities: entities,
		relations: relations.map(function (rel) {
			if (!hash[rel.update_id1] || !hash[rel.update_id2]) return null;
			var ents = entities.filter(function (e) {
				return ((rel.update_id1 == e.update_id) || (rel.update_id2 == e.update_id));
			});
			if (ents.length !== 2) return null;
			utils.validateRelation(rel);
			return rel;
		}).filter(function (rel) {
			return rel !== null;
		})
	};
};

loadFile(xingmap_entities, parseEntities, function (err, entities_raw) {
	//bla.sort(function (a, b) {
	//	if (a < b) return 1;
	//	if (a > b) return -1;
	//	return 0;
	//});
	//console.log(bla);
	loadFile(xingmap_relation, parseRelations, function (err, relations_raw) {
		var intermed = validate(entities_raw, relations_raw);
		intermed.entities.sort(function (a, b) {
			if (a.name < b.name) return -1;
			if (a.name > b.name) return 1;
			return 0;
		});
		api.update_intermed(intermed, function () {
			console.log('done');
			process.exit();
		});
	});
});
