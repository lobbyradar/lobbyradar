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
var config = require(path.resolve(__dirname, "config.js"));

// load mongojs 
var db = mongojs(config.db, ["entities","relations"]);

// local modules
var api = require("./lib/api.js")(config.api, db);

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
		data: [],	
		sources: [{
			url: data.source_url,
			created: (new Date()),
			updated: (new Date()),
			remark: "created by lobbyliste importer"
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
			data: [],	
			sources: [{
				url: data.source_url,
				created: (new Date()),
				updated: (new Date()),
				remark: "created by lobbyliste importer"
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
										data: [],
										sources: person.sources
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

/* * * thinktanks * * */

var convert_thinktank = function(data, fn){
	var result = {
		created: (new Date()),
		updated: (new Date()),
		type: "entity", // string
		tags: ["thinktank"], // array of strings
		name: data.name, // string
		aliases: [], // array of strings
		data: [],	
		sources: [{
			url: data.source_url,
			created: (new Date()),
			updated: (new Date()),
			remark: "created by tinktank importer"
		}]
	};
	
	// transfer adresses
	data.address.forEach(function(addr){
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
	
	// transfer url 
	if (data.hasOwnProperty("url") && (typeof data.url === "string") && data.url !== "") {
		result.data.push({
			"key": "url",
			"value": data.url,
			"desc": "URL",
			"format": "url",
			"auto": true,
			created: (new Date()),
			updated: (new Date())
		});
	};

	// transfer founded
	if (data.founded !== null) debug("founded %s", data.founded);
	/* FIXME
	if (data.hasOwnProperty("founded") && (typeof data.staff === "number") && !isNaN(data.staff)) {
		result.data.push({
			"key": "staff",
			"desc": "Anzahl der Mitarbeiter",
			"value": data.staff,
			"format": "number",
			"auto": true,
			created: (new Date()),
			updated: (new Date())
		});
	}; */

	// set type as tag
	if (data.hasOwnProperty("type") && (typeof data.type === "string") && data.type !== "") {
		result.tags.push(data.type);
	};
	
	// transfer staff
	if (data.hasOwnProperty("staff") && (typeof data.staff === "number") && !isNaN(data.staff)) {
		result.data.push({
			"key": "staff",
			"desc": "Anzahl der Mitarbeiter",
			"value": data.staff,
			"format": "number",
			"auto": true,
			created: (new Date()),
			updated: (new Date())
		});
	};
	
	// transfer topics
	if (data.hasOwnProperty("topics")) data.topics.forEach(function(topic){
		result.data.push({
			"key": "topic",
			"value": topic,
			"desc": "Thema",
			"format": "string",
			"auto": true,
			created: (new Date()),
			updated: (new Date())
		});
	});
	
	// transfer finance
	if (data.hasOwnProperty("finance") && (typeof data.finance === "string") && data.finance !== "") {
		result.data.push({
			"key": "finance",
			"desc": "Finanzierung",
			"value": data.finance,
			"format": "string",
			"auto": true,
			created: (new Date()),
			updated: (new Date())
		});
	};
	
	/* FIXME: add as entities with relation
	if (data.cooperations.length > 0) console.log("cooperations", data.cooperations);
	*/
	
	// transfer info
	if (data.hasOwnProperty("info") && (typeof data.info === "string") && data.info !== "") {
		result.data.push({
			"key": "description",
			"desc": "Beschreibungstext",
			"value": data.info,
			"format": "string",
			"auto": true,
			created: (new Date()),
			updated: (new Date())
		});
	};
	
	fn(null, result);
	
};

var extract_thinktank_people = function(data, fn) {
	if (!data.hasOwnProperty("people") || !(data.people instanceof Array)) return fn(new Error("entity contains no people"));
	data.people.forEach(function(person){

		if (!person || !person.hasOwnProperty("name") || typeof person.name !== "string" || person.name === "") {
			return fn(new Error("person has no name"));
		};
		
		debug("extracting person: %s", person.name);

		// FIXME: put original name to data in scraper for aliases
		var result = {
			created: (new Date()),
			updated: (new Date()),
			type: "executive",
			tags: ["thinktank"],
			name: person.name,
			aliases: [],
			data: [],	
			sources: [{
				url: data.source_url,
				created: (new Date()),
				updated: (new Date()),
				remark: "created by tinktank importer"
			}]
		};
		
		// transfert titles to data
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
		}
		
		fn(null, result);
		
	});
};

var import_thinktanks = function(){
	var q = async.queue(function(fn, next){
		fn(next);
	},5);
	q.drain = function(){
		debug("thinktanks done");
		cb();
	};
	var f = "thinktanks."+moment().format("YYYYMMDD")+".json.xz";
	var l = path.resolve(__dirname, "data", f);
	fs.exists(l, function(ex){
		var p = (ex) ? l : "http://download.odcdn.de/thinktanks/"+f;
		retrieve(p, function(err, chunk){
			if (err) return debug("error: %s", err);
			debug("importing thinktank %s", chunk.name);
			convert_thinktank(chunk, function(err, ent){
				if (err) return debug("error: %s", err);
				debug("converted thinktank %s", chunk.name);
				q.push(function(next){
					api.ent_create(ent, function(err, ent_id){
						next();
						if (err) return debug("error: %s", err);
						debug("entity created %s", ent.name);
						extract_thinktank_people(chunk, function(err, person){
							if (err) return debug("error: %s", err);
							api.ent_create(person, function(err, pers_id){
								if (err) return debug("error: %s", err);
								debug("person created %s", person.name);
								// create relation
								q.push(function(next){
									api.rel_create({
										entities: [ent_id, pers_id],
										type: "executive",
										tags: [],
										weight: 1,
										data: [],
										sources: person.sources
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

// import_lobbyliste();
// import_thinktanks();

(function(){
	api.reset("i know what i am doing", function(){
		import_lobbyliste(function(){
			process.exit();
			/*import_thinktanks(function(){
				debug("import finished");
			});*/
		});
	});
})();
