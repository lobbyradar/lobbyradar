var XLSX = require('xlsx-extract').XLSX;
var crypto = require("crypto");
var utils = require("./utils.js");

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
	{type: 'notes', rel: 0}
];


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

var parseEntities = function (parse_map, row) {
	var entities = [];
	parse_map.forEach(function (spec, i) {
		if (!spec.type) return; //skip
		entities[spec.entity || 0] = entities[spec.entity || 0] || {data: [], type: spec.entity_type, importer: 'xing'};
		var specparse = utils.entity_specs[spec.type];
		if (!specparse) {
			return console.log('invalid entity spec parse type', spec.type);
		}
		specparse(row[i], entities[spec.entity || 0])
	});
	return entities;
};

var parseRelations = function (parse_map, row) {
	var relations = [];
	var collect = null;
	parse_map.forEach(function (spec, i) {
		var val = row[i];
		if (spec.collect) {
			collect = collect || {};
			collect[spec.collect] = val;
			if (!spec.collect_end) return;
			val = spec.collect_end(collect);
			collect = null;
		}
		if (!spec.type) return; //skip
		relations[spec.rel || 0] = relations[spec.rel || 0] || {data: [], importer: 'xing'};
		var specparse = utils.relation_specs[spec.type];
		if (!specparse) {
			return console.log('invalid relation spec parse type', spec.type);
		}
		specparse(val, relations[spec.entity || 0])
	});
	return relations;
};

var validate = function (entites, relations) {
	var hash = {};
	var slugs = {};
	entites.forEach(function (entity) {
		if (isNaN(entity.update_id) || !entity.name) return;
		var e = hash[entity.update_id];
		if (e) {
			e.data = e.data.concat(entity.data);
		} else {
			var e = slugs[entity.name];
			if (e) {
				e.data = e.data.concat(entity.data);
				relations.forEach(function (rel) {
					if (rel.update_id1 == entity.update_id) rel.update_id1 = e.update_id;
					if (rel.update_id2 == entity.update_id) rel.update_id2 = e.update_id;
				});
			} else {
				hash[entity.update_id] = entity;
				slugs[entity.name] = entity;
			}
		}
	});

	Object.keys(hash).map(function (key) {
		var entity = hash[key];
		utils.validateEntity(entity);
		return entity;
	});

	return {
		entities: Object.keys(hash).map(function (key) {
			var entity = hash[key];
			utils.validateEntity(entity);
			return entity;
		}),
		relations: relations.map(function (rel) {
			if (!hash[rel.update_id1] || !hash[rel.update_id2]) return null;
			utils.validateRelation(rel);
			return rel;
		}).filter(function (rel) {
			return rel !== null;
		})
	};
};

loadFile(xingmap_entities, parseEntities, function (err, entites_raw) {
	loadFile(xingmap_relation, parseRelations, function (err, relations_raw) {
		var intermed = validate(entites_raw, relations_raw);
		utils.submit(intermed, function () {
			console.log('done');
		});
	});
});
