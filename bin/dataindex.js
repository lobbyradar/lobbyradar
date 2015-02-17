#!/usr/bin/env node

var mongojs = require("mongojs");
var moment = require("moment");
var debug = require("debug")("dataindex");
var async = require("async");
var path = require("path");

// load config
var config = require(path.resolve(__dirname, "../config.js"));

// load mongojs 
var db = mongojs(config.db, ["entities","relations","dataindex"]);

// local modules
var api = require(path.resolve(__dirname, "../lib/api.js"))(config.api, db);

var dataindex = function(id, reftype, type, data, emit){

	// don't index empty values
	if (data.value === "" || data.value === null) return;

	// flat data types
	if (typeof data.value !== "object") {
		if (data.format === "string" || data.format === "url") {
			emit({
				ref: id,
				reftype: reftype,
				type: type,
				key: data.key,
				format: data.format,
				value: data.value,
				text: data.value
			});
		} else {
			emit({
				ref: id,
				reftype: reftype,
				type: type,
				key: data.key,
				format: data.format,
				value: data.value
			});
		}
	} else {
		switch (data.key) {
			// ignore fields in search index
			case "source": break;
			case "photo": break;
			case "link": break;
			// address
			case "address":

				// name
				if (data.value.hasOwnProperty("name") && data.value.name !== null && data.value.name !== "") {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".name",
						format: "string",
						type: type,
						value: data.value.name,
						txt: data.value.name
					});
				};

				// address
				var val = [data.value.addr, data.value.street, data.value.postcode, data.value.city, data.value.country].filter(function(v){ return (v !== null && v !== ""); });
				if (val.length >= 1) {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".address",
						format: "string",
						type: type,
						value: val.join(", "),
						txt: val.join(", ")
					});
				};
				
				// tel
				if (data.value.hasOwnProperty("tel") && data.value.tel !== null && data.value.tel !== "") {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".tel",
						format: "string",
						type: type,
						value: data.value.tel,
						txt: data.value.tel
					});
				};
				
				// fax
				if (data.value.hasOwnProperty("fax") && data.value.fax !== null && data.value.fax !== "") {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".fax",
						format: "string",
						type: type,
						value: data.value.fax,
						txt: data.value.fax
					});
				};
				
				// email
				if (data.value.hasOwnProperty("email") && data.value.email !== null && data.value.email !== "") {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".email",
						format: "string",
						type: type,
						value: data.value.email,
						txt: data.value.email
					});
				};
				
				// www
				if (data.value.hasOwnProperty("www") && data.value.www !== null && data.value.www !== "") {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".www",
						format: "string",
						type: type,
						value: data.value.www,
						txt: data.value.www
					});
				};

			break;
			case "activity":

				if (data.value.type !== null && data.value.type !== "") {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".type",
						format: "string",
						type: type,
						value: data.value.type,
						txt: data.value.type
					});
				};

				if (data.value.level !== null) {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".level",
						format: "number",
						type: type,
						value: data.value.level
					});
				};

				if (data.value.year !== null) {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".year",
						format: "number",
						type: type,
						value: data.value.year
					});
				};
				
				if (data.value.begin !== null) {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".begin",
						format: "date",
						type: type,
						value: (new Date(data.value.begin))
					});
				};
				
				if (data.value.end !== null) {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".end",
						format: "date",
						type: type,
						value: (new Date(data.value.end))
					});
				};

				if (data.value.periodical !== null && data.value.periodical !== "") {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".periodical",
						format: "string",
						type: type,
						value: data.value.periodical,
						txt: data.value.periodical
					});
				};
				
				if (data.value.position !== null && data.value.position !== "") {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".position",
						format: "string",
						type: type,
						value: data.value.position,
						txt: data.value.position
					});
				};
				
				if (data.value.activity !== null && data.value.activity !== "") {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".activity",
						format: "string",
						type: type,
						value: data.value.activity,
						txt: data.value.activity
					});
				};
				
				if (data.value.place !== null && data.value.place !== "") {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".place",
						format: "string",
						type: type,
						value: data.value.place,
						txt: data.value.place
					});
				};
				
				if (data.value.unsalaried !== null) {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".unsalaried",
						format: "bool",
						type: type,
						value: data.value.unsalaried
					});
				};

			break;
			case "donation":
			
				if (data.value.year !== null) {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".year",
						format: "number",
						type: type,
						value: data.value.year
					});
				};
				
				if (data.value.amount !== null) {
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+".amount",
						format: "number",
						type: type,
						value: data.value.amount
					});
				};
			
			break;
			case "monthyear":

				emit({
					ref: id,
					reftype: reftype,
					key: data.key+".date",
					format: "date",
					type: type,
					value: (new Date(moment(data.value.month+"-"+data.value.year, "M-YYYY").toDate()))
				});
			
			break;
			// other stuff here
			default:
				// default behaviour
				Object.keys(data.value).forEach(function(k){
					// add to data type index
					emit({
						ref: id,
						reftype: reftype,
						key: data.key+"."+k,
						format: data.format,
						type: type,
						value: data.value[k]
					});
				});
			break;
		};
	} 
	return;
};

var index = function(fn){

	// preparing callback if none was given
	if (typeof fn !== "function") var fn = function(err){ if (err) throw err; };

	// reset database
	debug("emptying database");
	db.collection("dataindex").remove({}, function(err){
		if (err) return debug("database error: %s", err) || fn(err);
		debug("database emptied");

		// indicators
		var _total = 0;
		var _processed = 0;

		// creating database indexes
		debug("creating collection index");
		db.collection("dataindex").dropIndexes(function(){
			db.collection("dataindex").ensureIndex("ref");
			db.collection("dataindex").ensureIndex("reftype");
			db.collection("dataindex").ensureIndex("key");
			db.collection("dataindex").ensureIndex("format");
			db.collection("dataindex").ensureIndex("type");
			db.collection("dataindex").ensureIndex("idx");
			db.collection("dataindex").ensureIndex({
				"text": "text"
			}, {"background": true}, function(err){
				if (err) return debug("error creating collection index: %s", err);
				debug("collection index created");
			});
		});

		// building queue
		var q = async.queue(function(data, next){
			if (typeof data.value !== "string") data.idx = data.value;
			db.collection("dataindex").save(data, function(err, result){
				if (err) debug("database error: %s", err);
				_processed++;
				next();
			});
		}, 5);

		// indicator output
		var _timer = setInterval(function(){
			debug("%d/%d processed, %d in queue", _processed, _total, q.length());
		},5000)
	
		// finished
		q.drain = function(){
			debug("database queue is drained, %d items processed", _processed);
			// stop interval timer
			clearInterval(_timer);
			fn(null);
		};

		// retrieving entities
		debug("retrieving entities");
		api.ents(function(err, ents){
			if (err) return debug("error retrieving entities: %s", err) || fn(err);
			debug("%d entities retrieved", ents.length);
		
			// retrieving relations
			debug("retrieving relations");
			api.rels_full(function(err, rels){
				if (err) return debug("error retrieving relations: %s", err) || fn(err);
				debug("%d relations retrieved", rels.length);

				// indexing entities
				debug("indexing entities");
				ents.forEach(function(item){
					item.data.forEach(function(d){
						dataindex(item._id, "entity", item.type, d, function(di){
							_total++;
							q.push(di);
						});
					});
				});
			
				// indexing relations
				debug("preparing relations");
				rels.forEach(function(item){
					item.data.forEach(function(d){
						dataindex(item._id, "relation", item.type, d, function(di){
							_total++;
							q.push(di);
						});
					});
				});
			});
		});
	});
};

index(function(err){
	if (err) return debug("indexing failed with error %s", err);
	debug("indexing done");
	process.exit();
});
