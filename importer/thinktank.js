#!/usr/bin/env node

var jsonstream = require("JSONStream");
var mongojs = require("mongojs");
var request = require("request");
var moment = require("moment");
var debug = require("debug")("importer:thinktank");
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

/* * * thinktanks * * */

var convert_thinktank = function(data, fn){
	var result = {
		importer: "thinktanks",
		created: (new Date()),
		updated: (new Date()),
		type: "entity", // string
		tags: ["thinktank"], // array of strings
		name: data.name, // string
		aliases: [], // array of strings
		data: [{
			key: "source",
			value: {
				url: data.source_url,
				remark: "created by tinktank importer"
			},
			desc: "Quelle",
			format: "link",
			auto: true,
			created: (new Date()),
			updated: (new Date())
		}]
	};
	
	// transfer adresses
	data.address.forEach(function(addr){

		// convert scraper format
		var addrdata = {
			type: 'main',
			name: addr.name,
			addr: addr.extra.join(", "),
			street: addr.street,
			postcode: addr.postcode,
			city: addr.city,
			country: addr.country,
			email: addr.email,
			tel: addr.phone,
			fax: addr.fax
		};

		result.data.push({
			"key": "address",
			"value": addrdata,
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
			"desc": "Webseite",
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
			"desc": "Beschreibung",
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

		// testing for "k.A."
		if (/^\s*k\.\s*a\.\s*$/i.test(person.name)) return fn(new Error("person is unknown"));
				
		debug("extracting person: %s", person.name);

		// fixing brackets after name
		if (/^([^\(]+)\s*\(([^\)]+)\)\s*$/.test(person.name)) {
			if (person.hasOwnProperty("titles") && (typeof person.titles === "string") && person.titles !== "") {
				person.titles = [person.titles];
			} else {
				person.titles = [];
			}
			person.titles.push(person.name.replace(/^([^\(]+)\s*\(([^\)]+)\)\s*$/, "$2"));
			person.titles = person.titles.join(", ");
			person.name = person.name.replace(/^([^\(]+)\s*\(([^\)]+)\)\s*$/, "$1");
		};
		
		// fix some random brackets
		person.name = person.name.replace(/[\s\(]*$/,"");
		person.titles = person.titles.replace(/[\s\)]*$/,"");

		// FIXME: put original name to data in scraper for aliases
		var result = {
			importer: "thinktanks",
			created: (new Date()),
			updated: (new Date()),
			type: "person",
			tags: ["thinktank", "executive"],
			name: person.name,
			aliases: [],
			data: [{
				key: "source",
				value: {
					url: data.source_url,
					remark: "created by thinktank importer"
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
		}
		
		fn(null, result);
		
	});
};

var import_thinktanks = function(finish){
	var q = async.queue(function(fn, next){
		fn(next);
	},1);
	q.drain = function(){
		debug("thinktanks done");
		finish();
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
					api.ent_creaxtend(ent, function(err, ent_id){
						next();
						if (err) return debug("error: %s", err);
						debug("entity created %s", ent.name);
						extract_thinktank_people(chunk, function(err, person){
							if (err) return debug("error: %s", err);
							api.ent_creaxtend(person, function(err, pers_id){
								if (err) return debug("error: %s", err);
								debug("person created %s", person.name);
								// create relation
								q.push(function(next){
									api.rel_creaxtend({
										importer: "thinktanks",
										entities: [ent_id, pers_id],
										type: "executive",
										tags: [],
										weight: 1,
										data: (function(){
											var data = [];
											var source = person.data.filter(function(set){
												return (set.key === "source");
											});
											if (source.length > 0) data.push(source.pop());
											return data;
										})()
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
	import_thinktanks(function(){
		fn();
	});
};

if (module.parent === null) {
	// execute in standalone mode
	debug("resetting data");
	api.purge("thinktanks", function(){
		execute(function(){
			debug("import finished");
			process.exit();
		});
	});
} else {
	// export in required mode
	module.exports = execute;
};
