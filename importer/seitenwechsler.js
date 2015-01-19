#!/usr/bin/env node

var mongojs = require("mongojs");
var moment = require("moment");
var debug = require("debug")("importer:seitenwechsler");
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

var namecomb = function(names){
	names = names.map(function(name){
		name = name.trim();
		var nm = [name];
		name.split(/\-/g).forEach(function(n){
			if (nm.indexOf(n) < 0) nm.push(n);
		});
		if (/^(von|de)\s+/.test(name)) {
			nm.push(name.replace(/^(von|de)\s+/,''));
		} else {
			name.split(/\s+/g).forEach(function(n){
				if (nm.indexOf(n) < 0) nm.push(n);
			});
		}
		return nm;
	});
	var out = [];
	names[0].forEach(function(v){
		names[1].forEach(function(n){
			out.push([v,n].join(" "));
		});
	});
	return out;
};

var aliases = function(str, abbr){
	var result = (abbr) ? [str, abbr] : [str];
	if (/\s+(e\.V\.|AG|SE|Inc\.|GmbH)$/.test(str)) result.push(str.replace(/\s+(e\.V\.|AG|SE|Inc\.|GmbH)$/g,''));
	return result;
};

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
		debug("building %s %s", set.vorname, set.nachname);
		
		// set partei as tag
		set.roottags = set.tags = set.tag.split(/, /g);
		if (set.partei !== "") set.roottags.push(slug(set.partei, " ").toLowerCase());
		
		// initial data set
		var ent = {
			importer: "seitenwechsler",
			created: (new Date()),
			updated: (new Date()),
			type: "person",
			tags: set.roottags,
			name: [set.vorname, set.nachname].join(" "),
			aliases: namecomb([set.vorname, set.nachname]),
			data: [{
				key: "source",
				value: {
					url: "https://lobbypedia.de/wiki/Seitenwechsler_in_Deutschland_im_%C3%9Cberblick",
					remark: "created by seitenwechsler importer"
				},
				desc: "Quelle",
				format: "link",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			},{
				key: "partei",
				value: set.partei,
				desc: "Partei",
				format: "string",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			},{
				key: "surname",
				value: set.nachname,
				desc: "Nachname",
				format: "string",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			},{
				key: "names",
				value: set.vorname,
				desc: "Vornamen",
				format: "string",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			}]
		};

		q.push(function(next){
			api.ent_creaxtend(ent, function(err, ent_id){
				next();

				if (err) return debug("error: %s", err);
				debug("entity created %s", ent.name);

				// partei
				if (set.partei !== "" && set.partei !== "parteilos") {
					debug("creating party %s", set.partei);
				
					var ent_partei = {
						importer: "seitenwechsler",
						created: (new Date()),
						updated: (new Date()),
						type: "entity", // string
						tags: ["partei"], // array of strings
						name: set.partei, // string
						aliases: [], // array of strings
						data: [{
							key: "partei",
							value: set.partei,
							desc: "Partei",
							format: "string",
							auto: true,
							created: (new Date()),
							updated: (new Date())
						}]
					};
				
					q.push(function(nxt){
						api.ent_creaxtend(ent_partei, function(err, party_id){
							nxt();

							if (err) return debug("error: %s", err);
							debug("entity created %s", ent.name);

							// create relation person ↔ partei
							q.push(function(nx){
								api.rel_creaxtend({
									importer: "seitenwechsler",
									entities: [ent_id, party_id],
									type: "member",
									tags: ["partei"],
									weight: 1,
									data: [{
										key: "source",
										value: {
											url: "https://lobbypedia.de/wiki/Seitenwechsler_in_Deutschland_im_%C3%9Cberblick",
											remark: "created by seitenwechsler importer"
										},
										desc: "Quelle",
										format: "link",
										auto: true,
										created: (new Date()),
										updated: (new Date())
									}]
								}, function(err, rel_id){
									if (err) return (debug("error: %s", err) || nx());
									debug("relation created %s → %s", ent.name, ent_partei.name);
									nx();
								});
							});

						});

					});
					
				};
				
				// arbeitgeber-entity
				if (set.entity !== "") {
					
					debug("creating entity %s", set.entity);
					
					var ent_employ = {
						importer: "seitenwechsler",
						created: (new Date()),
						updated: (new Date()),
						type: "entity", // string
						tags: ent.tags, // array of strings
						name: set.entity, // string
						aliases: aliases(set.entity, set.kuerzel), // array of strings
						data: [{
							key: "source",
							value: {
								url: "https://lobbypedia.de/wiki/Seitenwechsler_in_Deutschland_im_%C3%9Cberblick",
								remark: "created by seitenwechsler importer"
							},
							desc: "Quelle",
							format: "link",
							auto: true,
							created: (new Date()),
							updated: (new Date())
						}]
					};
					
					// create employer
					q.push(function(nxt){
						api.ent_creaxtend(ent_employ, function(err, employ_id){
							nxt();

							if (err) return debug("error: %s", err);
							debug("entity created %s", ent.name);

							// create relation person ↔ partei
							q.push(function(nx){
								var employ_rel = {
									importer: "seitenwechsler",
									entities: [ent_id, employ_id],
									type: "position",
									tags: ent.tags,
									weight: 1,
									data: [{
										key: "source",
										value: {
											url: "https://lobbypedia.de/wiki/Seitenwechsler_in_Deutschland_im_%C3%9Cberblick",
											remark: "created by seitenwechsler importer"
										},
										desc: "Quelle",
										format: "link",
										auto: true,
										created: (new Date()),
										updated: (new Date())
									},{
										key: "position",
										value: set.position,
										desc: "Position",
										format: "string",
										auto: true,
										created: (new Date()),
										updated: (new Date())
									}]
								};
								
								// add dates if given
								if (set.y_begin !== "") {
									employ_rel.data.push({
										key: "begin",
										value: {
											month: (parseInt(set.m_begin,10) || null),
											year: (parseInt(set.y_begin,10) || null)
										},
										desc: "Beginn",
										format: "monthyear",
										auto: true,
										created: (new Date()),
										updated: (new Date())
									});
								};

								if (set.y_begin !== "") {
									employ_rel.data.push({
										key: "begin",
										value: {
											month: (parseInt(set.m_begin,10) || null),
											year: (parseInt(set.y_begin,10) || null)
										},
										desc: "Beginn",
										format: "monthyear",
										auto: true,
										created: (new Date()),
										updated: (new Date())
									});
								};
								
								api.rel_creaxtend(employ_rel, function(err, rel_id){
									if (err) return (debug("error: %s", err) || nx());
									debug("relation created %s → %s", ent.name, ent_employ.name);
									nx();
								});
							});

						});

					});
					
				};
				
			});
		});
		

	});

	fs.createReadStream(path.resolve(__dirname, "data/seitenwechsler.2011.tsv"), {encoding: 'utf8'}).pipe(parser);
	
};

if (module.parent === null) {
	// execute in standalone mode
	debug("resetting data");
	api.reset("i know what i am doing", function(){
		execute(function(){
			debug("import finished");
			process.exit();
		});
	});
} else {
	// export in required mode
	module.exports = execute;
};
