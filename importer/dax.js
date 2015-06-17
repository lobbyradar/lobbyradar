#!/usr/bin/env node

var mongojs = require("mongojs");
var moment = require("moment");
var debug = require("debug")("importer:dax");
var async = require("async");
var path = require("path");
var slug = require("slug");
var xz = require("xz");
var fs = require("fs");
var sv = require("sv");

// load config
var config = require(path.resolve(__dirname, "../config.js"));

// load mongojs 
var db = mongojs(config.db, ["entities","relations"]);

// local modules
var api = require(path.resolve(__dirname, "../lib/api.js"))(config.api, db);

// importer
var execute = function(finish){

	var q = async.queue(function(fn, next){
		fn(next);
	},1);

	q.drain = function(){
		debug("importer done");
		finish();
	};

	var parser = new sv.Parser();

	parser.on('data', function(set) {
		debug("building %s", set.firma);
				
		// initial data set
		var ent = {
			importer: "dax",
			created: (new Date()),
			updated: (new Date()),
			type: "entity",
			tags: ["dax"],
			name: set.firma,
			aliases: [set.firmenname_alias_1, set.firmenname_alias_2, set.firmenname_alias_3, set.firmenname_alias_4].filter(function(f){
				return (f !== null && f !== "");
			}),
			data: [{
				key: "source",
				value: {
					url: set.quelle_vorstand,
					remark: "created by dax importer"
				},
				desc: "Quelle",
				format: "link",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			},{
				key: "source",
				value: {
					url: set.quelle_aufsichtsrat,
					remark: "created by dax importer"
				},
				desc: "Quelle",
				format: "link",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			},{
				key: "url",
				value: {
					url: set.url,
					remark: "Webseite"
				},
				desc: "Webseite",
				format: "link",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			},{
				key: "legalform",
				value: set.Rechtsform,
				desc: "Rechtsform",
				format: "string",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			}]
		};

		q.push(function(next){
			api.ent_creaxtend(ent, function(err, ent_id){

				if (err) return debug("error: %s", err);
				debug("entity created %s", ent.name);

				// persons
				var persons = [];
				
				persons.push({
					tag: "vorstand",
					type: "Vorstandsvorsitz",
					vorname: set.vorname_vorstandsvorsitzender,
					nachname: set.nachname_vorstandsvorsitzender,
					name: [set.vorname_vorstandsvorsitzender, set.nachname_vorstandsvorsitzender].join(" "),
				});

				persons.push({
					tag: "aufsichtsrat",
					type: "Aufsichtsratsvorsitz",
					vorname: set.vorname_aufsichtsratsvorsitzender,
					nachname: set.nachname_aufsichtsratsvorsitzender,
					name: [set.vorname_aufsichtsratsvorsitzender, set.nachname_aufsichtsratsvorsitzender].join(" "),
				});

				set.vorstand_rest.split(/;\s+/g).forEach(function(p){
					persons.push({
						tag: "vorstand",
						type: "Vorstandsmitglied",
						name: p,
					});
				});

				set.aufsichtsrat_rest.split(/;\s+/g).forEach(function(p){
					persons.push({
						tag: "aufsichtsrat",
						type: "Aufsichtsratsmitglied",
						name: p,
					});
				});
				
				// add persons
				persons.forEach(function(p){
					
					var pers = {
						importer: "dax",
						created: (new Date()),
						updated: (new Date()),
						type: "person",
						tags: ["dax", p.tag],
						name: p.name,
						aliases: [],
						data: [{
							key: "source",
							value: {
								url: set["quelle_"+p.tag],
								remark: "created by dax importer"
							},
							desc: "Quelle",
							format: "link",
							auto: true,
							created: (new Date()),
							updated: (new Date())
						}]
					};
					
					if (p.hasOwnProperty("vorname")) {
						pers.data.push({
							key: "names",
							value: p.vorname,
							desc: "Vornamen",
							format: "string",
							auto: true,
							created: (new Date()),
							updated: (new Date())
						});
					};
					
					if (p.hasOwnProperty("nachname")) {
						pers.data.push({
							key: "surname",
							value: p.nachname,
							desc: "Nachname",
							format: "string",
							auto: true,
							created: (new Date()),
							updated: (new Date())
						});
					};
					
					// add person
					q.push(function(nxt){
						api.ent_creaxtend(pers, function(err, pers_id){
							if (err) return debug("error: %s", err);
							debug("entity created %s", pers.name);
							
							// add relation
							q.push(function(nx){
								api.rel_creaxtend({
									importer: "dax",
									entities: [ent_id, pers_id],
									type: "executive",
									tags: ["dax", p.tag],
									weight: 1,
									data: [{
										key: "source",
										value: {
											url: set["quelle_"+p.tag],
											remark: "created by dax importer"
										},
										desc: "Quelle",
										format: "link",
										auto: true,
										created: (new Date()),
										updated: (new Date())
									},{
										key: "position",
										value: p.type,
										desc: "Position",
										format: "string",
										auto: true,
										created: (new Date()),
										updated: (new Date())
									}]
								}, function(err, rel_id){
									if (err) return (debug("error: %s", err) || nx());
									debug("relation created %s → %s", ent.name, pers.name);
									nx();
								});
							});
							nxt();
							
						});
					});
					
					
				});
				
				next();
				
			});
		});
		

	});

	fs.createReadStream(path.resolve(__dirname, "data/dax.tsv"), {encoding: 'utf8'}).pipe(parser);
	
};

if (module.parent === null) {
	// execute in standalone mode
	debug("resetting data");
	api.purge("dax", function(){
		execute(function(){
			debug("import finished");
			process.exit();
		});
	});
} else {
	// export in required mode
	module.exports = execute;
};
