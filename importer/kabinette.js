#!/usr/bin/env node

var mongojs = require("mongojs");
var moment = require("moment");
var debug = require("debug")("importer:kabinette");
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

// kabinett entities
var kabinette = [{ 
	"importer": "kabinette",
	"name": "Kabinett Merkel III",
	"slug": "kabinett-merkel-3",
	"type": "entity",
	"tags": ["kabinett","merkel"],
	"aliases": ["Kabinett Merkel 3"],
	"data": [{ 
		"key": "begin",
		"value": moment("2013-12-17","YYYY-MM-DD").toDate(),
		"desc": "Von",
		"format": "date",
		"auto": true
	}],
	"search": ["kabinett","merkel","kabinett merkel","merkel 3","3","iii","merkel iii"] 
},{
	"importer": "kabinette",
	"name": "Kabinett Merkel II",
	"slug": "kabinett-merkel-2",
	"type": "entity",
	"tags": ["kabinett","merkel"],
	"aliases": ["Kabinett Merkel 2"],
	"data": [{ 
		"key": "begin",
		"value": moment("2009-10-28","YYYY-MM-DD").toDate(),
		"desc": "Von",
		"format": "date",
		"auto": true
	},{
		"key": "end",
		"value": moment("2013-12-17","YYYY-MM-DD").toDate(),
		"desc": "Bis",
		"format": "date",
		"auto": true
	}],
	"search": ["kabinett","merkel","kabinett merkel","merkel 2","2","ii","merkel ii"]
},{
	"importer": "kabinette",
	"name": "Kabinett Merkel I",
	"slug": "kabinett-merkel-1",
	"type": "entity",
	"tags": ["kabinett","merkel"],
	"aliases": ["Kabinett Merkel 1"],
	"data": [{ 
		"key": "begin",
		"value": moment("2005-11-22","YYYY-MM-DD").toDate(),
		"desc": "Von",
		"format": "date",
		"auto": true
	},{
		"key": "end",
		"value": moment("2009-10-28","YYYY-MM-DD").toDate(),
		"desc": "Bis",
		"format": "date",
		"auto": true
	}],
	"search": ["kabinett","merkel","kabinett merkel","merkel 2","2","ii","merkel ii"]
},{
	"importer": "kabinette",
	"name": "Kabinett Schröder II",
	"slug": "kabinett-schroeder-2",
	"type": "entity",
	"tags": ["kabinett","schröder"],
	"aliases": ["Kabinett Schröder 2"],
	"data": [{ 
		"key": "begin",
		"value": moment("2002-10-22","YYYY-MM-DD").toDate(),
		"desc": "Von",
		"format": "date",
		"auto": true
	},{
		"key": "end",
		"value": moment("2005-10-18","YYYY-MM-DD").toDate(),
		"desc": "Bis",
		"format": "date",
		"auto": true
	}],
	"search": ["kabinett","schroeder","schröder","kabinett schröder","kabinett schroeder","schröder 2","schroeder 2","2","ii","schroeder ii","schröder ii"]
},{
	"importer": "kabinette",
	"name": "Kabinett Schröder I",
	"slug": "kabinett-schroeder-1",
	"type": "entity",
	"tags": ["kabinett","schröder"],
	"aliases": ["Kabinett Schröder 1"],
	"data": [{ 
		"key": "begin",
		"value": moment("1998-10-27","YYYY-MM-DD").toDate(),
		"desc": "Von",
		"format": "date",
		"auto": true
	},{
		"key": "end",
		"value": moment("2002-10-22","YYYY-MM-DD").toDate(),
		"desc": "Bis",
		"format": "date",
		"auto": true
	}],
	"search": ["kabinett","schroeder","schröder","kabinett schröder","kabinett schroeder","schröder 1","schroeder 1","1","i","schroeder i","schröder i"]
}];

var cabs = function(done){
	debug("importing cabs");
	var q = async.queue(function(fn, next){
		fn(next);
	},1);
	var cabids = {};
	q.drain = function(){
		debug("cabs done");
		done(cabids);
	};
	kabinette.forEach(function(ent){
		q.push(function(next){
			api.ent_creaxtend(ent, function(err, ent_id){
				cabids[ent.name.replace(/^Kabinett\s+/,'')] = ent_id;
				next();
				if (err) return debug("error: %s", err);
				debug("entity created %s", ent.name);
			});
		});
	});
};

// importer
var execute = function(finish){
	cabs(function(_cabs){
		
		var q = async.queue(function(fn, next){
			fn(next);
		},1);

		q.drain = function(){
			debug("importer done");
			finish();
		};

		var parser = new sv.Parser();

		parser.on('data', function(set) {
			debug("building %s (%s)", set.name.replace(/^\s+|\s+$/g,''), set.kabinett.replace(/^\s+|\s+$/g,''));
		
			var item = {
				"name": set.name.replace(/^\s+|\s+$/g,''),
				"kabinett": set.kabinett.replace(/^\s+|\s+$/g,''),
				"tags": [set.tag1, set.tag2, set.tag3].filter(function(tag){ return (typeof tag == "string" && tag !== ""); }).map(function(tag){ return api.unify(tag); }),
				"rels": ("1234".split("").map(function(n){ return "v"+n; }).map(function(n){
					if (!set.hasOwnProperty(n+"org") || (typeof set[n+"org"] !== "string") || (set[n+"org"] === "")) return null;
					// go for it
					return {
						"organisation": set[n+"org"].replace(/^\s+|\s+$/g,''),
						"type": (function(t){
							switch (t) {
								case "Mitglied": return "member"; break;
								case "government": return "government"; break;
								default: 
									debug("Unknown relation type: %s", t);
									return t.toLowerCase();
								break;
							}
						})(set[n+"art"].replace(/^\s+|\s+$/g,'')),
						"position": set[n+"position"].replace(/^\s+|\s+$/g,''),
						"start": (function(d){
							if (d === "") return null;
							if (/\./.test(d)) return moment(d, "DD.MM.YYYY").toDate();
							if (/\//.test(d)) return moment(d, "M/D/YY").toDate();
							debug("invalid date %s", d);
							return null;
						})(set[n+"beginn"].replace(/^\s+|\s+$/g,'')),
						"end": (function(d){
							if (d === "") return null;
							if (/\./.test(d)) return moment(d, "DD.MM.YYYY").toDate();
							if (/\//.test(d)) return moment(d, "M/D/YY").toDate();
							debug("invalid date %s", d);
							return null;
						})(set[n+"ende"].replace(/^\s+|\s+$/g,''))
					};
				}).filter(function(set){ return set !== null; }))
			};
			
			// add member
			q.push(function(next){
				api.ent_creaxtend({
					importer: "kabinette",
					created: (new Date()),
					updated: (new Date()),
					type: "entity",
					tags: ["kabinette"].concat(item.tags),
					name: item.name,
					aliases: [],
					data: []
				}, function(err, member_id){
					next();
					if (err) return debug("error: %s", err);
					debug("entity created %s", item.name);
					
					// add connection to kabinett
					// create relation
					q.push(function(nx){
						api.rel_creaxtend({
							importer: "kabinette",
							entities: [member_id, _cabs[item.kabinett]],
							type: "member",
							tags: ["kabinette","kabinett","regierung"],
							weight: 1,
							data: []
						}, function(err, rel_id){
							if (err) return (debug("error: %s", err) || nx());
							debug("relation created %s → %s", item.name, item.kabinett);
							nx();
						});
					});
					
					// create organisation
					item.rels.forEach(function(rel){

						q.push(function(nxt){
							api.ent_creaxtend({
								importer: "kabinette",
								created: (new Date()),
								updated: (new Date()),
								type: "entity",
								tags: [],
								name: rel.organisation,
								aliases: [],
								data: []
							}, function(err, org_id){
								if (err) return debug("error: %s", err);
								debug("entity created %s", rel.organisation);

								// create relation
								q.push(function(nx){
									api.rel_creaxtend({
										importer: "kabinette",
										entities: [member_id, org_id],
										type: rel.type,
										tags: ["kabinette"],
										weight: 1,
										data: [{
											key: "position",
											value: rel.position,
											desc: "Position",
											format: "string",
											auto: true,
											created: (new Date()),
											updated: (new Date())
										},{
											key: "begin",
											value: rel.start,
											desc: "Von",
											format: "date",
											auto: true,
											created: (new Date()),
											updated: (new Date())
										},{
											key: "end",
											value: rel.end,
											desc: "Bis",
											format: "date",
											auto: true,
											created: (new Date()),
											updated: (new Date())
										}].filter(function(d){ return (d.value !== "" && d.value !== null) })
									}, function(err, rel_id){
										if (err) return (debug("error: %s", err) || nx());
										debug("relation created %s → %s", item.name, rel.organisation);
										nx();
									});
								});
								nxt();
							});
						});
					});
				});
			});
		});
		fs.createReadStream(path.resolve(__dirname, "data/kabinette.csv"), {encoding: 'utf8'}).pipe(parser);
	});
};

if (module.parent === null) {
	// execute in standalone mode
	debug("resetting data");
	api.purge("kabinette", function(){
		execute(function(){
			debug("import finished");
			process.exit();
		});
	});
} else {
	// export in required mode
	module.exports = execute;
};
