#!/usr/bin/env node

var jsonstream = require("JSONStream");
var mongojs = require("mongojs");
var request = require("request");
var moment = require("moment");
var debug = require("debug")("importer:bundestag");
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

// load data
var data = JSON.parse(fs.readFileSync(path.resolve(__dirname, "data/bundestag.combined.json")));

// data on fraktionen
var frakdata = {
	"Bündnis 90/Die Grünen": {
		importer: "bundestag",
		created: (new Date()),
		updated: (new Date()),
		type: "entity",
		name: "Fraktion Bündnis 90/Die Grünen",
		aliases: ["Grüne Fraktion", "Grünen-Fraktion", "Bündnisgrüne Fraktion"],
		tags: ["fraktion", "grüne"],
		data: [{
			key: "partei",
			value: "Die Grünen",
			desc: "Partei",
			format: "string",
			auto: true,
			created: (new Date()),
			updated: (new Date())
		}]	
	},
	"CDU/CSU": {
		importer: "bundestag",
		created: (new Date()),
		updated: (new Date()),
		type: "entity",
		name: "CDU/CSU-Fraktion",
		aliases: ["CDU-Fraktion", "CSU-Fraktion", "Unionsfraktion"],
		tags: ["fraktion", "cdu", "csu"],
		data: [{
			key: "partei",
			value: "CDU",
			desc: "Partei",
			format: "string",
			auto: true,
			created: (new Date()),
			updated: (new Date())
		},{
			key: "partei",
			value: "CSU",
			desc: "Partei",
			format: "string",
			auto: true,
			created: (new Date()),
			updated: (new Date())
		}]
	},
	"Die Linke": {
		importer: "bundestag",
		created: (new Date()),
		updated: (new Date()),
		type: "entity",
		name: "Fraktion Die Linke",
		aliases: ["Linksfraktion", "Linke Fraktion"],
		tags: ["fraktion", "linke"],
		data: [{
			key: "partei",
			value: "Die Linke",
			desc: "Partei",
			format: "string",
			auto: true,
			created: (new Date()),
			updated: (new Date())
		}]
	},
	"SPD": {
		importer: "bundestag",
		created: (new Date()),
		updated: (new Date()),
		type: "entity",
		name: "SPD-Fraktion",
		aliases: ["Sozialdemokratische Fraktion"],
		tags: ["fraktion", "spd"],
		data: [{
			key: "partei",
			value: "SPD",
			desc: "Partei",
			format: "string",
			auto: true,
			created: (new Date()),
			updated: (new Date())
		}]
	},
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

	data.forEach(function(set){
		debug("building %s", set.name);
		
		var ent = {
			importer: "bundestag",
			created: (new Date()),
			updated: (new Date()),
			type: "person",
			tags: ["mdb","bundestag"],
			name: [set.vorname, set.nachname].join(" "),
			aliases: set.aliases,
			data: [{
				key: "source",
				value: {
					url: set.web.filter(function(item){
						return (item.service === "bundestag");
					}).pop().url,
					remark: "created by bundestag importer"
				},
				desc: "Quelle",
				format: "link",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			}]
		};
		
		// nachname
		ent.data.push({
			key: "surname",
			value: set.nachname,
			desc: "Nachname",
			format: "string",
			auto: true,
			created: (new Date()),
			updated: (new Date())
		});

		// vorname
		ent.data.push({
			key: "names",
			value: set.vorname,
			desc: "Vornamen",
			format: "string",
			auto: true,
			created: (new Date()),
			updated: (new Date())
		});
		
		
		// add fotos
		set.fotos.forEach(function(foto){
			ent.data.push({
				key: "photo",
				value: foto,
				desc: "Foto",
				format: "photo",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			});
		});
		
		// compile contacts
		var contacts = {};
		set.kontakt.forEach(function(k){
			if (!contacts.hasOwnProperty(k.name)) contacts[k.name] = {
				type: "main",
				name: ent.name,
				addr: k.name,
			};
			
			switch (k.type) {
				case "address":
					var m = k.address.match(/^([^,]+), ([0-9]{5}) ([^,]+)(, ([^,]+))?$/);
					if (!m) {
						debug("addr mismatch %s", k.address);
						return;
					}
					contacts[k.name].street = m[1];
					contacts[k.name].postcode = m[2];
					contacts[k.name].city = m[3];
					contacts[k.name].county = (m[5]||"Germany");
				break;
				case "email":
					contacts[k.name].email = k.address;
				break;
				case "phone":
					contacts[k.name].tel = k.address;
				break;
				case "fax":
					contacts[k.name].fax = k.address;
				break;
				default: 
					debug("unknown kontakt type %s", k.type);
					process.exit();
				break;
			}
		});
		
		// add addresses
		Object.keys(contacts).forEach(function(k){
			ent.data.push({
				key: "photo",
				value: contacts[k],
				desc: "Foto",
				format: "photo",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			});
		});

		// add links
		set.web.forEach(function(web){
			switch (web.service) {
				case "unknown": var remark = ""; break;
				case "bundestag": var remark = "Biografie auf Bundestag.de"; break;
				case "agw": var remark = "Abgeordnetenwatch"; break;
				case "wikipedia": var remark = "Wikipedia"; break;
				case "fraktion": var remark = "Fraktion "+ent.fraktion; break;
				case "website": var remark = "Persönliche Webseite"; break;
				case "facebook": var remark = "Facebook-Profil"; break;
				case "twitter": var remark = "Twitter-Account"; break;
				case "bundestag_reden": var remark = "Reden-Archiv auf Bundestag.de"; break;
				case "youtube": var remark = "YouTube-Kanal"; break;
				case "xing": var remark = "Xing-Profile"; break;
				case "blog": var remark = "Persönliches Blog"; break;
				case "meinvz": var remark = "MeinVZ-Eintrag"; break;
				default: 
					debug("unknown web service %s", web.service);
					return;
				break;
			};

			ent.data.push({
				key: "link",
				value: {
					url: web.url,
					remark: remark
				},
				desc: "Link",
				format: "link",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			});
			
		});

		// wahldaten
		if (set.wahl.wahlkreis_id !== null || set.wahl.wahlkreis !== null) {
			ent.data.push({
				key: "wahlkreis",
				value: [set.wahl.wahlkreis_id, set.wahl.wahlkreis].filter(function(i){ return (i !== null); }).join(", "),
				desc: "Wahlkreis",
				format: "string",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			});
		};
		
		if (set.wahl.bundesland !== null && set.wahl.bundesland !== "") {
			ent.data.push({
				key: "bundesland",
				value: set.wahl.bundesland,
				desc: "Bundesland",
				format: "string",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			});
		};
		
		if (set.wahl.liste !== null && set.wahl.liste !== "") {
			ent.data.push({
				key: "landesliste",
				value: set.wahl.liste,
				desc: "Landesliste",
				format: "string",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			});
		};
		
		if (set.wahl.listenplatz !== null && set.wahl.listenplatz !== "") {
			ent.data.push({
				key: "listenplatz",
				value: parseInt(set.wahl.listenplatz,10),
				desc: "Listenplatz",
				format: "integer",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			});
		};
		
		if (set.wahl.ergebnis !== null && set.wahl.ergebnis !== "") {
			ent.data.push({
				key: "wahlergebnis",
				value: set.wahl.ergebnis,
				desc: "Wahlergebnis",
				format: "string",
				auto: true,
				created: (new Date()),
				updated: (new Date())
			});
		};
		
		ent.data.push({
			key: "btcertuid",
			value: set.meta.btcert.uid,
			desc: "Benutzename BT-Cert",
			format: "string",
			auto: true,
			created: (new Date()),
			updated: (new Date())
		});
		
		if (set.title !== "") {
			ent.data.push({
				"key": "titles",
				"value": set.title,
				"desc": "Titel",
				"format": "string",
				"auto": true,
				created: (new Date()),
				updated: (new Date())
			});
		};
				
		q.push(function(next){
			api.ent_creaxtend(ent, function(err, ent_id){
				next();
				if (err) return debug("error: %s", err);
				debug("entity created %s", ent.name);
				
				// add ALL the relations

				// fraktion
				q.push(function(nxt){
					api.ent_creaxtend(frakdata[set.fraktion], function(err, _ent_id){
						nxt();
						if (err) return debug("error: %s", err);
						debug("entity created %s", frakdata[set.fraktion].name);
						
						// fraktion relation
						q.push(function(nx){
							api.rel_creaxtend({
								importer: "bundestag",
								entities: [ent_id, _ent_id],
								type: "member",
								tags: [],
								weight: 1,
								data: []
							}, function(err, rel_id){
								if (err) return (debug("error: %s", err) || nx());
								debug("relation created %s → %s", ent.name, frakdata[set.fraktion].name);
								nx();
								
								// partei
								if (["Bündnis 90/Die Grünen","CDU/CSU","Die Linke","SPD"].indexOf(set.fraktion) >= 0) {
									// determine partei 
									switch (set.fraktion) {
										case "Bündnis 90/Die Grünen": var partei = "Die Grünen"; break;
										case "Die Linke": var partei = "Die Linke"; break;
										case "SPD": var partei = "SPD"; break;
										case "CDU/CSU": 
											var partei = (set.hasOwnProperty("csu") && set.csu) ? "CSU" : "CDU"; 
										break;
									}
									q.push(function(nnxt){
										api.ent_creaxtend({
											importer: "bundestag",
											created: (new Date()),
											updated: (new Date()),
											type: "entity",
											tags: ["partei"],
											name: partei,
											aliases: [],
											data: [{
												key: "partei",
												value: partei,
												desc: "Partei",
												format: "string",
												auto: true,
												created: (new Date()),
												updated: (new Date())
											}]
										}, function(err, __ent_id){
											nnxt();
											if (err) return debug("error: %s", err);
											debug("entity created %s", partei);

											// fraktion relation
											q.push(function(nnx){
												api.rel_creaxtend({
													importer: "bundestag",
													entities: [ent_id, __ent_id],
													type: "member",
													tags: [],
													weight: 1,
													data: []
												}, function(err, rel_id){
													if (err) return (debug("error: %s", err) || nnx());
													debug("relation created %s → %s", ent.name, partei);
													nnx();

													// relation fraktion → partei
													q.push(function(nnnx){
														api.rel_creaxtend({
															importer: "bundestag",
															entities: [_ent_id, __ent_id],
															type: "association",
															tags: [],
															weight: 1,
															data: []
														}, function(err, rel_id){
															if (err) return (debug("error: %s", err) || nnnx());
															debug("relation created %s → %s", frakdata[set.fraktion].name, partei);
															nnnx();
														});
													});
												});
											});
										});
									});
								};
							});
						});
					});
				});
				
				// nebeneinkuenfte
				set.nebeneinkuenfte.forEach(function(nek){
					q.push(function(nxt){
						api.ent_creaxtend({
							importer: "bundestag",
							created: (new Date()),
							updated: (new Date()),
							type: "entity",
							tags: "nebeneinkuenfte",
							name: nek.entity,
							aliases: nek.aliases,
							data: [{
								key: "source",
								value: {
									url: set.web.filter(function(item){
										return (item.service === "bundestag");
									}).pop().url,
									remark: "created by bundestag importer"
								},
								desc: "Quelle",
								format: "link",
								auto: true,
								created: (new Date()),
								updated: (new Date())
							},{
								key: "address",
								value: {
									type: 'main',
									name: nek.entity,
									addr: "",
									street: "",
									postcode: "",
									city: nek.ort,
									country: ""
								},
								desc: "Adresse",
								format: "address",
								auto: true,
								created: (new Date()),
								updated: (new Date())
							}]
						}, function(err, _ent_id){
							nxt();
							if (err) return debug("error: %s", err);
							debug("entity created %s", nek.entity);

							// nebeneinkunft relation
							q.push(function(nx){
								api.rel_creaxtend({
									importer: "bundestag",
									entities: [ent_id, _ent_id],
									type: "activity",
									tags: ["nebentätigkeit"],
									weight: 1,
									data: [{
										key: "activity",
										value: {
											type: nek.type,
											level: nek.level,
											year: nek.year,
											begin: ((nek.begin) ? new Date(nek.begin) : null),
											end: ((nek.end) ? new Date(nek.end) : null),
											periodical: nek.periodical,
											position: nek.position,
											activity: nek.taetigkeit,
											place: nek.taetigkeit_ort,
											unsalaried: nek.ehrenamtlich
										},
										desc: "Angaben zur Nebentätigkeit",
										format: "activity",
										auto: true,
										created: (new Date()),
										updated: (new Date())
									}]
								}, function(err, rel_id){
									if (err) return (debug("error: %s", err) || nx());
									debug("relation created %s → %s", ent.name, nek.entity);
									nx();
								});
							});
						});
					});
				});
				
				// ausschuesse
				set.ausschuesse.forEach(function(com){
					q.push(function(nxt){
						api.ent_creaxtend({
							importer: "bundestag",
							created: (new Date()),
							updated: (new Date()),
							type: "entity",
							tags: "committee",
							name: com.name,
							aliases: [],
							data: [{
								key: "source",
								value: {
									url: com.url,
									remark: "created by bundestag importer"
								},
								desc: "Quelle",
								format: "link",
								auto: true,
								created: (new Date()),
								updated: (new Date())
							}]
						}, function(err, _ent_id){
							nxt();
							if (err) return debug("error: %s", err);
							debug("entity created %s", com.name);

							// nebeneinkunft relation
							q.push(function(nx){
								api.rel_creaxtend({
									importer: "bundestag",
									entities: [ent_id, _ent_id],
									type: "member",
									tags: ["committee"],
									weight: 1,
									data: [{
										key: "position",
										value: com.funktion,
										desc: "Funktion im Ausschuss",
										format: "string",
										auto: true,
										created: (new Date()),
										updated: (new Date())
									}]
								}, function(err, rel_id){
									if (err) return (debug("error: %s", err) || nx());
									debug("relation created %s → %s", ent.name, com.name);
									nx();
								});
							});
						});
					});
				});
			});
		});
	});

};

if (module.parent === null) {
	// execute in standalone mode
	debug("purging data");
	api.purge("bundestag", function(){
		debug("data purged");
		execute(function(){
			debug("import finished");
			process.exit();
		});
	});
} else {
	// export in required mode
	module.exports = execute;
};


