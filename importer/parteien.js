#!/usr/bin/env node

var mongojs = require("mongojs");
var async = require("async");
var debug = require("debug")("importer:parteien");
var path = require("path");
var fs = require("fs");

// load config
var config = require(path.resolve(__dirname, "../config.js"));

// load mongojs 
var db = mongojs(config.db, ["entities","relations"]);

// local modules
var api = require(path.resolve(__dirname, "../lib/api.js"))(config.api, db);

var parteien = [{ 
	"importer": "parteien",
	"name": "SPD",
	"slug": "spd",
	"type": "entity",
	"tags": ["partei","spd"],
	"aliases": ["Sozialdemokratische Partei Deutschlands", "Sozialdemokratische Partei", "Sozialdemokraten"],
	"data": [ 
		{ "key": "address",
			"value": { 
				"type": "main",
				"name": "Sozialdemokratische Partei Deutschlands",
				"addr": "Willy-Brandt-Haus",
				"street": "Wilhelmstraße 141",
				"postcode": "10963",
				"city": "Berlin",
				"country": "Deutschland",
				"www": "http://www.spd.de/"
			},
			"desc": "Adresse",
			"format": "address",
			"auto": true
		}
	],
	"search": ["spd", "sozialdemokratische partei deutschlands", "sozialdemokratische partei", "sozialdemokraten"] 
},{
	"importer": "parteien",
	"name": "Die Grünen",
	"slug": "die grünen",
	"type": "entity",
	"tags": ["partei","grüne"],
	"aliases": ["BÜNDNIS 90/DIE GRÜNEN", "Grüne", "Die Grünen", "Bündins 90", "Bündins 90/Die Grünen", "Bündnisgrüne"],
	"data": [ 
		{ "key": "address",
			"value": { 
				"type": "main",
				"name": "BÜNDNIS 90/DIE GRÜNEN",
				"addr": "Bundesgeschäftsstelle",
				"street": "Platz vor dem Neuen Tor 1",
				"postcode": "10115",
				"city": "Berlin",
				"country": "Deutschland",
				"www": "http://www.gruene.de/",
				"email": "info@gruene.de",
				"tel": "+4930284420",
				"fax": "+493028442210"
			},
			"desc": "Adresse",
			"format": "address",
			"auto": true
		}
	],
	"search": ["bündnis 90 die grünen", "grüne", "die grünen", "bündins 90", "bündnisgrüne", "buendnis 90 die gruenen", "gruene", "die gruenen", "buendins 90", "buendnisgruene"]
},{
	"importer": "parteien",
	"name": "Die Linke",
	"slug": "die linke",
	"type": "entity",
	"tags": ["partei","linke"],
	"aliases": ["Die Linke", "Partei DIE LINKE", "DIE LINKE.", "Linkspartei", "Linke", "Linkspartei.PDS", "PDS", "WASG", "Partei des Demokratischen Sozialismus", "Arbeit & soziale Gerechtigkeit – Die Wahlalternative", "Wahlalternative", "Wahlalternative Arbeit und soziale Gerechtigkeit"],
	"data": [ 
		{ "key": "address",
			"value": { 
				"type": "main",
				"name": "Partei DIE LINKE",
				"addr": "Bundesgeschäftsstelle",
				"street": "Kleine Alexanderstraße 28",
				"postcode": "10178",
				"city": "Berlin",
				"country": "Deutschland",
				"www": "http://www.die-linke.de/",
				"email": "bundesgeschaeftsstelle@die-linke.de",
				"tel": "+493024009397",
				"fax": "+493024009310"
			},
			"desc": "Adresse",
			"format": "address",
			"auto": true
		}
	],
	"search": ["die linke", "partei die linke", "linkspartei", "linke", "linkspartei pds", "pds", "wasg", "partei des demokratischen sozialismus", "arbeit und soziale gerechtigkeit die wahlalternative", "wahlalternative", "wahlalternative arbeit und soziale gerechtigkeit"]
},{
	"importer": "parteien",
	"name": "FDP",
	"slug": "fdp",
	"type": "entity",
	"tags": ["partei","fdp"],
	"aliases": ["Freie Demokratische Partei", "Freie Demokraten", "Die Liberalen", "Liberale", "Freidemokraten", "F.D.P."],
	"data": [ 
		{ "key": "address",
			"value": { 
				"type": "main",
				"name": "FDP-Bundespartei",
				"street": "Reinhardtstraße 14",
				"postcode": "10117",
				"city": "Berlin",
				"country": "Deutschland",
				"www": "http://www.dfp.de/",
				"email": "fdp-point@fdp.de",
				"tel": "+49302849580"
			},
			"desc": "Adresse",
			"format": "address",
			"auto": true
		}
	],
	"search": ["fdp", "freie demokratische partei", "freie demokraten", "die liberalen", "liberale", "freidemokraten", "f d p"]
},{
	"importer": "parteien",
	"name": "CDU",
	"slug": "cdu",
	"type": "entity",
	"tags": ["partei","cdu"],
	"aliases": ["CDU","Christlich Demokratische Union Deutschlands","Christlich Demokratische Union","Christdemokraten"],
	"data": [ 
		{ "key": "address",
			"value": { 
				"type": "main",
				"name": "Christlich Demokratische Union Deutschlands (CDU)",
				"addr": "Konrad-Adenauer-Haus",
				"street": "Klingelhöferstraße 8",
				"postcode": "10785",
				"city": "Berlin",
				"country": "Deutschland",
				"www": "http://www.cdu.de/",
				"email": "info@cdu.de",
				"tel": "+4930220700",
				"fax": "+493022070111"
			},
			"desc": "Adresse",
			"format": "address",
			"auto": true
		}
	],
	"search": ["cdu","christlich demokratische union deutschlands","christlich demokratische union","christdemokraten"]
},{
	"importer": "parteien",
	"name": "CSU",
	"slug": "csu",
	"type": "entity",
	"tags": ["partei","csu"],
	"aliases": ["CSU", "Christlich-Soziale Union in Bayern", "Christlich-Soziale Union", "Christlich Soziale Union", "Christlich-Soziale Union in Bayern e.V."],
	"data": [ 
		{ "key": "address",
			"value": { 
				"type": "main",
				"name": "Christlich-Soziale Union in Bayern e. V. (CSU)",
				"addr": "Franz-Josef-Strauß-Haus",
				"street": "Nymphenburger Straße 64",
				"postcode": "80335",
				"city": "München",
				"country": "Deutschland",
				"www": "http://www.csu.de/",
				"email": "landesleitung@csu-bayern.de",
				"tel": "+498912430",
				"fax": "+49891243299"
			},
			"desc": "Adresse",
			"format": "address",
			"auto": true
		}
	],
	"search": ["csu", "christlich soziale union in bayern", "christlich soziale union", "christlich soziale union in bayern e v"]
}];

var execute = function(done){
	var q = async.queue(function(fn, next){
		fn(next);
	},1);
	q.drain = function(){
		debug("import done");
		done();
	};
	parteien.forEach(function(ent){
		q.push(function(next){
			api.ent_creaxtend(ent, function(err, ent_id){
				next();
				if (err) return debug("error: %s", err);
				debug("entity created %s", ent.name);
			});
		});
	});
};

if (module.parent === null) {
	// execute in standalone mode
	debug("resetting data");
	api.purge("parteien", function(){
		execute(function(){
			debug("import finished");
			process.exit();
		});
	});
} else {
	// export in required mode
	module.exports = execute;
};


