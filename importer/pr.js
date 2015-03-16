#!/usr/bin/env node

var mongojs = require("mongojs");
var moment = require("moment");
var debug = require("debug")("importer:pr");
var async = require("async");
var path = require("path");
var fs = require("fs");
var sv = require("sv");

// load config
var config = require(path.resolve(__dirname, "../config.js"));

// load mongojs 
var db = mongojs(config.db, ["entities","relations","dataindex"]);

// local modules
var api = require(path.resolve(__dirname, "../lib/api.js"))(config.api, db);

var execute = function(finish){

	var q = async.queue(function(fn, next){
		fn(next);
	},1);

	q.drain = function(){
		debug("importer done");
		finish();
	};

	var parser = new sv.Parser();

	parser.on('data', function(set){
		
		var set = {
			name: set.name,
			tags: set.tags.split(/,\s+/).map(function(s){ return s.replace(/^\s+|\s+$/g,''); }),
			homepage: (set.homepage||null),
			quelle: (set.quelle||null),
			ents: []
				.concat(set.mitarbeiter.replace(/^\s+|\s+$/g,'').split(/,\s+/).map(function(s){ return { type: "person", name: s, rel: "position" }}))
				.concat(set.kunden.replace(/^\s+|\s+$/g,'').split(/,\s+/).map(function(s){ return { type: "organisation", name: s, rel: "business" }}))
				.concat(set.bestandteil.replace(/^\s+|\s+$/g,'').split(/,\s+/).map(function(s){ return { type: "organisation", name: s, rel: "association" }}))
				.filter(function(i){ return (i.name !== null && i.name !== "");  })
		};

		q.push(function(next){
			api.ent_creaxtend({
				importer: "pr",
				created: (new Date()),
				updated: (new Date()),
				type: "organisation",
				tags: set.tags,
				name: set.name,
				aliases: [],
				data: [{
					key: "source",
					value: {
						url: set.quelle,
						remark: "created by pr importer"
					},
					desc: "Quelle",
					format: "link",
					auto: true,
					created: (new Date()),
					updated: (new Date())
				},{
					key: "url",
					value: set.homepage,
					desc: "URL",
					format: "url",
					auto: true,
					created: (new Date()),
					updated: (new Date())
				}].filter(function(d){ return (d.value !== "" && d.value !== null); })
			}, function(err, id){
				next();
				if (err) return debug("error: %s", err);
				debug("entity created %s", set.name);
				
				set.ents.forEach(function(ent){
					
					q.push(function(nxt){
						api.ent_creaxtend({
							importer: "pr",
							created: (new Date()),
							updated: (new Date()),
							type: ent.type,
							tags: [],
							name: ent.name,
							aliases: [],
							data: [{
								key: "source",
								value: {
									url: set.quelle,
									remark: "created by pr importer"
								},
								desc: "Quelle",
								format: "link",
								auto: true,
								created: (new Date()),
								updated: (new Date())
							}].filter(function(d){ return (d.value !== "" && d.value !== null); })
						}, function(err, eid){
							nxt();
							if (err) return debug("error: %s", err);
							debug("entity created %s", ent.name);
							
							// create relation
							q.push(function(nx){
								api.rel_creaxtend({
									importer: "pr",
									entities: [id, eid],
									type: ent.rel,
									tags: [set.tags[0]],
									weight: 1,
									data: [{
										key: "source",
										value: {
											url: set.quelle,
											remark: "created by pr importer"
										},
										desc: "Quelle",
										format: "link",
										auto: true,
										created: (new Date()),
										updated: (new Date())
									}].filter(function(d){ return (d.value !== "" && d.value !== null); })
								}, function(err, rel_id){
									if (err) return (debug("error: %s", err) || nx());
									debug("relation created %s → %s", set.name, ent.name);
									nx();
								});
							});

						});
					});
				});
			});
		});
	});

	fs.createReadStream(path.resolve(__dirname, "data/pr.tsv"), {encoding: 'utf8'}).pipe(parser);

};


if (module.parent === null) {
	// execute in standalone mode
	debug("resetting data");
	api.purge("pr", function(){
		execute(function(){
			debug("import finished");
			process.exit();
		});
	});
} else {
	// export in required mode
	module.exports = execute;
};
