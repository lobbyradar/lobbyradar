#!/usr/bin/env node

var jsonstream = require("JSONStream");
var mongojs = require("mongojs");
var request = require("request");
var moment = require("moment");
var debug = require("debug")("import");
var async = require("async");
var path = require("path");
var xz = require("xz");
var fs = require("fs");

// load config
var config = require(path.resolve(__dirname, "../config.js"));

// load mongojs 
var db = mongojs(config.db, ["entities","relations"]);

// local modules
var api = require(path.resolve(__dirname, "../lib/api.js"))(config.api, db);

var retrieve = function(p, fn){	
	var decompressor = new xz.Decompressor();
	var jsonparser = new jsonstream.parse('*');
	
	jsonparser.on("data", function(chunk){
		return fn(null, chunk);
	}).on("error", function(err){
		debug("jsons stream error %s", err);
		return fn(err);
	}).on("end", function(){
		// decompressor needs to be ended like this.
		debug("json stream end");
	});
	decompressor.on("end", function(){
		jsonparser.end();
		debug("decompression end");
	}).on("error", function(err){
		debug("decompression error %s", err);
		return fn(err);
	});

	debug("retrieving %s", p);
	if (/^https?:\/\//.test(p)){
		if (/\.xz$/.test(p)) {
			request.get(p).pipe(decompressor).pipe(jsonparser);
		} else {
			request.get(p).pipe(jsonparser);
		}
	} else {
		if (path.extname(p) === ".xz") {
			fs.createReadStream(p).pipe(decompressor).pipe(jsonparser);
		} else {
			fs.createReadStream(p).pipe(jsonparser);
		}
	}
	return;
};

/* * * lobbyliste * * */

var convert_lobbyliste = function(data, fn){

	var result = {
		created: (new Date()),
		updated: (new Date()),
		type: "entity",
		tags: ["lobby"],
		name: data.name,
		slug: api.unify(data.name),
		aliases: [],
		data: [{
			key: "source",
			value: {
				url: data.source_url,
				remark: "created by lobbyliste importer"
			},
			desc: "Quelle",
			format: "link",
			auto: true,
			created: (new Date()),
			updated: (new Date())
		}]
	};
	
	// transfer adresses
	data.addr.forEach(function(addr){
		result.data.push({
			"key": "address",
			"value": addr,
			"desc": "Adresse",
			"format": "address",
			"auto": true,
			created: (new Date()),
			updated: (new Date())
		});
	});
	
	// transfer members
	if (data.hasOwnProperty("members") && !isNaN(data.members)) {
		result.data.push({
			"key": "members",
			"desc": "Anzahl der Mitglieder",
			"value": data.members,
			"format": "number",
			"auto": true,
			created: (new Date()),
			updated: (new Date())
		});
	};

	// transfer orgs
	if (data.hasOwnProperty("orgs") && !isNaN(data.orgs)) {
		result.data.push({
			"key": "organisations",
			"desc": "Anzahl der Mitgliedsorganisationen",
			"value": data.orgs,
			"format": "number",
			"auto": true,
			created: (new Date()),
			updated: (new Date())
		});
	};
	
	// transfer description
	if (data.hasOwnProperty("description") && (typeof data.description === "string") && data.description !== "") {
		result.data.push({
			"key": "description",
			"desc": "Beschreibungstext",
			"value": data.description,
			"format": "string",
			"auto": true,
			created: (new Date()),
			updated: (new Date())
		});
	};

	fn(null, result);
	
};

var extract_lobbyliste_people = function(data, fn) {

	if (!data.hasOwnProperty("people") || !(data.people instanceof Array)) return fn(new Error("entity contains no people"));
	data.people.forEach(function(person){

		if (!person || !person.hasOwnProperty("name") || typeof person.name !== "string" || person.name === "") {
			return fn(new Error("person has no name"));
		};
		
		// FIXME: put original name to data in scraper for aliases
		var result = {
			created: (new Date()),
			updated: (new Date()),
			type: "person",
			tags: ["lobby"],
			name: person.name,
			slug: api.unify(person.name),
			aliases: [],
			data: [{
				key: "source",
				value: {
					url: data.source_url,
					remark: "created by lobbyliste importer"
				},
				desc: "Quelle",
				format: "link",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			}]
		};
		
		// transfer titles to data
		if (person.hasOwnProperty("titles") && (typeof person.titles === "string") && person.titles !== "") {
			result.data.push({
				"key": "titles",
				"value": person.titles,
				"desc": "Titel",
				"format": "string",
				"auto": true,
				created: (new Date()),
				updated: (new Date())
			});
		};
		
		// transfer position to data
		if (person.hasOwnProperty("position") && (typeof person.position === "string") && person.position !== "") {
			result.data.push({
				"key": "position",
				"value": person.position,
				"desc": "Position",
				"format": "string",
				"auto": true,
				created: (new Date()),
				updated: (new Date())
			});
		};
		
		switch (person.type) {
			case "vorstand": result.tags.push("executive"); break;
			case "verband": result.tags.push("representative"); break;
			default: return fn(new Error("unknown type "+person.type+" for "+person.name)); break;
		}
				
		fn(null, result);
		
	});
};

var import_lobbyliste = function(cb){
	// async queue
	var q = async.queue(function(fn, next){
		fn(next);
	},5);
	q.drain = function(){
		debug("lobbyliste done");
		cb();
	};
	var f = "lobbyliste."+moment().format("YYYYMMDD")+".json.xz";
	var l = path.resolve(__dirname, "data", f);
	fs.exists(l, function(ex){
		var p = (ex) ? l : "http://download.odcdn.de/lobbyliste/"+f;
		retrieve(p, function(err, chunk){
			if (err) return debug("error: %s", err);
			debug("importing lobbyliste %s", chunk.name);
			convert_lobbyliste(chunk, function(err, ent){
				if (err) return debug("error: %s", err);
				debug("converted lobbyliste %s", chunk.name);
				q.push(function(next){
					api.ent_creaxtend(ent, function(err, ent_id){
						next();
						if (err) return debug("error: %s", err);
						debug("entity created %s", ent.name);
						extract_lobbyliste_people(chunk, function(err, person){
							if (err) return debug("error: %s", err);
							api.ent_creaxtend(person, function(err, pers_id){
								if (err) return debug("error: %s", err);
								debug("person created %s", person.name);
								// create relation
								q.push(function(next){
									api.rel_create({
										entities: [ent_id, pers_id],
										type: "executive",
										tags: [],
										weight: 1,
										data: [].push(person.data.filter(function(set){
											return (set.key === "source");
										}).pop()),
									}, function(err, rel_id){
										if (err) return (debug("error: %s", err) || next());
										debug("relation created %s → %s", chunk.name, person.name);
										next();
									});
								});
							});
						});
					});
				});
			});
		});
	});
};

var execute = function(fn){
	import_lobbyliste(function(){
		fn();
	});
};

if (module.parent === null) {
	// execute in standalone mode
	debug("resetting data");
	api.reset("i know what i am doing", function(){
		execute(function(){
			debug("import finished");
		});
	});
} else {
	// export in required mode
	module.exports = execute;
};