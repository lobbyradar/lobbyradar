#!/usr/bin/env node

var validator = require("validator");
var moment = require("moment");
var crypto = require("crypto");
var debug = require("debug")("api");
var slug = require("slug");
var uniq = require("unq");

function api(opt, db){

	if (!(this instanceof api)) return new api(opt, db);
	var self = this;

	self.opt = opt;
	self.db = db;

	// wait for db
	self.ready = false;
	self.db.on('ready',function() {
		debug("database ready");

		// ensure indexes
		self.db.collection("entities").ensureIndex("name", {"background": true});
		self.db.collection("entities").ensureIndex("aliases", {"background": true});
		self.db.collection("entities").ensureIndex("type", {"background": true});
		self.db.collection("entities").ensureIndex("tags", {"background": true});
		self.db.collection("entities").ensureIndex("relations", {"background": true});
		self.db.collection("entities").ensureIndex("search", {"background": true});
		self.db.collection("entities").ensureIndex("slug", {"background": true});
		self.db.collection("entities").ensureIndex("importer", {"background": true});
		self.db.collection("relations").ensureIndex("entities", {"background": true});
		self.db.collection("relations").ensureIndex("tags", {"background": true});
		self.db.collection("relations").ensureIndex("type", {"background": true});
		self.db.collection("relations").ensureIndex("weight", {"background": true});
		self.db.collection("relations").ensureIndex("importer", {"background": true});
		self.ready = true;
	});

	self.db.on('error',function(err) {
		debug("database error: %s", err);
	});

	return this;
};

/* * * helpers * * */

// ❌ drop database
api.prototype.reset = function(safephrase, fn){
	var self = this;
	fn(new Error("this method is not available any more"));
	return this;
};

// ✓ purge database
api.prototype.purge = function(importer, fn){
	var self = this;
	self.db.collection("entities").remove({"importer": importer}, function(err){
		if (err) return fn(err);
		self.db.collection("relations").remove({"importer": importer}, function(err){
			if (err) return fn(err);
			debug("collections emptied");
			fn(null);
		});
	});
	return this;
};

// ✓ simple representation of string (sync!)
api.prototype.unify = function(str){
	return slug(str, " ").toLowerCase();
};

// ✓ unify name and aliases of entity (sync!)
api.prototype.ent_unify = function(ent){
	var self = this;
	var result = [];

	// fix string-only entities
	if (typeof ent === "string") ent = {name: ent};

	// add name
	result.push(self.unify(ent.name));

	// add aliases if present
	if (ent.hasOwnProperty("aliases")) ent.aliases.forEach(function(alias){
		var alias = self.unify(alias);
		if (result.indexOf(alias) < 0) result.push(alias);
	});

	// filter empty strings
	return result.filter(function(q){
		return (typeof q === "string" && q.replace(/\s+/g,'') !== "");
	});

};

// ✓ merge data sets (sync!)
api.prototype.merge_data = function(a,b){
	var hashes = [];
	var set = [];
	a.forEach(function(e){
		hashes.push(crypto.createHash("sha256").update(JSON.stringify([e.key, e.format, e.value])).digest('hex'));
		set.push(e);
	});
	b.forEach(function(e){
		if (hashes.indexOf(crypto.createHash("sha256").update(JSON.stringify([e.key, e.format, e.value])).digest('hex')) < 0) set.push(e);
	});
	return set;
};

/* * * entity operations * * */

// ✓ check entity
api.prototype.ent_check = function(data, fn){
	var self = this;

	// entity prototype
	var ent = {
		importer: null,
		name: null,
		slug: null,
		created: (new Date()),
		updated: (new Date()),
		type: null,
		tags: [],
		aliases: [],
		data: [],
		search: []
	};

	var vali_date_date = function(d){
		if (typeof d == "string") {
			d = moment(d);
			if (!d.isValid()) return {err:"created is not a valid date"};
			return {date:d.toDate()};
		}
		if (!(d instanceof Date)) return {err:"created is not a Date object"};
		return {date:d};
	};

	// check created
	if (data.hasOwnProperty("created")){
		var d = vali_date_date(data.created);
		if (d.err) return  fn(new Error(d.err));
		ent.created = d.date;
	}

	// check name
	if (!data.hasOwnProperty("name") || typeof data.name !== "string" || data.name === "") return fn(new Error("name is not a string"));
	ent.name = data.name;
	ent.slug = self.unify(data.name);

	// check type
	if (!data.hasOwnProperty("type") || typeof data.type !== "string" || data.type === "") return fn(new Error("type is not a string"));
	ent.type = data.type;

	// check tags
	if (data.hasOwnProperty("tags") && data.tags) {
		if (typeof data.tags === "string") data.tags = data.tags.split(/([\,\;]|\s+#)/g);
		if (!(data.tags instanceof Array)) return fn(new Error("tags is not an array"));
		data.tags.map(function(tag){
			// fix tags to trimmed lower case
			return tag.toLowerCase().replace(/\s+/g,'-').replace(/[\s_\-\.]+/g,'-').replace(/^\-+|\-+$/g,'').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/ß/g,'ss').toLowerCase(); // fixme: make this nicer and use linebreaks
		}).filter(function(tag){
			// filter still-invalid tags
			return /^[a-z0-9\-]+$/.test(tag);
		}).map(function(tag){
			// add to object prototype
			ent.tags.push(tag);
		});
	}

	// check aliases
	if (data.hasOwnProperty("aliases") && data.aliases) {
		if (!(data.aliases instanceof Array)) return fn(new Error("alsiases is not an array"));
		data.aliases.filter(function(alias){
			return ((typeof alias === "string") && alias !== "");
		}).map(function(alias){
			ent.aliases.push(alias);
		});
	};

	// transfer importer
	if (data.hasOwnProperty("importer") && (typeof data.importer === "string")) ent.importer = data.importer;

	// transfer data // FIXME: make separate function
	if (data.hasOwnProperty("data") && (data.data instanceof Array)){
		data.data.forEach(function(dataset){
			// check dataset
			if (!dataset.hasOwnProperty("key") || (typeof dataset.key !== "string") || dataset.key === "") return;
			if (!dataset.hasOwnProperty("value")) return;
			if (!dataset.hasOwnProperty("desc") || (typeof dataset.desc !== "string")) return;
			if (!dataset.hasOwnProperty("format") || (typeof dataset.format !== "string") || dataset.format === "") return; // FIXME: proper format check
			if (!dataset.hasOwnProperty("auto") || (typeof dataset.auto !== "boolean")) dataset.auto = false;
			if (!dataset.hasOwnProperty("created")) dataset.created = new Date();
			else dataset.created = vali_date_date(dataset.created).date || new Date();
			if (!dataset.hasOwnProperty("updated")) dataset.updated = new Date();
			else dataset.updated = vali_date_date(dataset.updated).date || new Date();
			// assign random id if nessecary
			if (!dataset.hasOwnProperty("id")) dataset.id = crypto.pseudoRandomBytes(32).toString('hex');
			ent.data.push(dataset);
		});
	};

	// create search strings
	ent.search = self.ent_unify(ent);
	fn(null, ent);

	return this;
};

// ✓ create an entity
api.prototype.ent_create = function(data, fn){
	debug("create entity");
	var self = this;
	self.ent_check(data, function(err, data){
		if (err) return fn(err);
		self.db.collection("entities").save(data, function(err, result){
			if (err) return fn(err);
			debug("entity created: %s", result._id);
			fn(null, result._id, result);
		});
	});
	return this;
};

// ✓ retrieve an entity
api.prototype.ent_get = function(id, fn){
	debug("get entity %s", id);
	var self = this;
	self.db.collection("entities").findOne({_id: self.db.ObjectId(id)}, function(err, result){
		if (!err) debug("got entity %s", id);
		fn(err, result);
	});
	return this;
};

// ✓ delete an entity and all relations
api.prototype.ent_delete = function(id, fn){
	debug("delete entity %s", id);
	var self = this;
	self.db.collection("entities").remove({_id: self.db.ObjectId(id)}, true, function(err, result){
		if (!err) debug("deleted entity %s", id);
		// FIXME: remove relations
		fn(err, result);
	});
	return this;
};

// ✓ update an entity
api.prototype.ent_update = function(id, data, fn){
	debug("update entity: %s", id);
	var self = this;
	self.ent_check(data, function(err, data){
		if (err) return fn(err);
		self.db.collection("entities").update({_id: self.db.ObjectId(id)}, data, {upsert: true}, function(err, result){
			if (err) return fn(err);
			debug("entity updated: %s", id);
			fn(null, id);
		});
	});
	return this;
};

// ✓ merge entities
api.prototype.ent_merge = function(ids, fn){
	var self = this;
	debug("merge entity %s with %s", ids[0], ids[1]);
	self.ent_get(ids[0], function(err, a){
		if (err) return fn(err);
		if (a === null) return fn(new Error("entity "+ids[0]+" does not exist"));
		self.ent_get(ids[1], function(err, b){
			if (err) return fn(err);
			if (b === null) return fn(new Error("entity "+ids[1]+" does not exist"));
			
			if (a.type !== b.type) return fn(new Error("type mismatch: "+a.type+" <> "+b.type));
			
			// name, aliases
			a.aliases = uniq([a.name, b.name].concat(a.aliases).concat(a.aliases));
			a.name = a.aliases.shift();
			
			// tags
			a.tags = uniq(a.tags.concat(b.tags));
			
			// created
			a.created = (a.created < b.created) ? a.created : b.created;
			
			// updated
			a.updated = (new Date());
			
			// remove importer to prevent overwrite
			delete a.importer
			
			// merge data
			a.data = self.merge_data(a.data, b.data);
			
			// update a
			self.ent_update(ids[0], a, function(err){
				if (err) return fn(err);
				// update relations
				self.rel_replace(ids[0], ids[1], function(err){
					if (err) return fn(err);
					// delete entity
					self.ent_delete(ids[1], function(err){
						return fn(err);
					});
				});
			});
		});
	});
	return this;
};

// split entity into two (and create horcrux)
// FIXME: implement this too
api.prototype.ent_split = function(id, a, b, fn){
	var self = this;
	fn(new Error("not implemented"));
	return this;
};

// ✓ automagically merge entity versions
api.prototype.ent_upmerge = function(id, data, fn){
	debug("upmerge entity %s", id);
	var self = this;
	self.ent_get(id, function(err, a){
		if (err) return fn(err);
		self.ent_check(data, function(err, b){
			if (err) return fn(err);

			// transfer creation date
			b.created = a.created;

			// transfer original importer
			if (a.hasOwnProperty("importer")) b.importer = a.importer;

			// if name changed, push old name to aliases
			if (b.name !== a.name && b.aliases.indexOf(a.name) < 0) b.aliases.push(a.name);

			// transfer aliases
			a.aliases.forEach(function(alias){
				if (b.aliases.indexOf(alias) < 0) b.aliases.push(alias);
			});

			// transfer type
			b.type = a.type;

			// transfer tags
			a.tags.forEach(function(tag){
				if (b.tags.indexOf(tag) < 0) b.tags.push(tag);
			});

			// transfer data
			b.data = self.merge_data(b.data, a.data);

			self.ent_update(id, b, function(err, result_id){

				if (err) return fn(err);

				debug("upmerged entity %s", id);
				fn(null, result_id);

			});
		});
	});
	return this;
};

// ✓ automagically create or extend entity
api.prototype.ent_creaxtend = function(data, fn){
	debug("creaxtend entity %s", data.name);
	var self = this;
	self.ent_check(data, function(err, ent){
		if (err) return fn(err);
		self.ent_match(ent, function(err, result){
			if (err || !result) {
				// create entity
				debug("creaxtend create new entity %s", data.name);
				self.ent_create(ent, fn);
			} else {
				// merge!
				debug("creaxtend merge existing entity %s", data.name);
				self.ent_upmerge(result._id, ent, function(err, result_id){
					if (err || !result_id) {
						console.log("ERR", err, result, ent, result_id);
						process.exit();
					}
					fn(err, result_id);
				});
			}
		});
	});
	return this;
};

/* * * relation operations * * */

// ✓ check relation
api.prototype.rel_check = function(data, fn){
	var self = this;

	var vali_date_date = function(d){
		if (typeof d == "string") {
			d = moment(d);
			if (!d.isValid()) return {err:"created is not a valid date"};
			return {date:d.toDate()};
		}
		if (!(d instanceof Date)) return {err:"created is not a Date object"};
		return {date:d};
	};

	// relation prototype
	var rel = {
		importer: null,
		created: (new Date()),
		updated: (new Date()),
		type: null,
		weight: 0,
		entities: [],
		tags: [],
		data: []
	};

	// check entities
	if (!data.hasOwnProperty("entities") || !(data.entities instanceof Array)) return fn(new Error("entities must not be empty"));
	data.entities = data.entities.map(function(entity){
		return entity.toString();
	}).filter(function(entity){
		return (entity && (typeof entity === "string") && /^[a-f0-9]{24}$/.test(entity));
	});
	if (data.entities.length !== 2) return fn(new Error("entities must contain 2 elements"));
	data.entities.map(function(entity){
		rel.entities.push(self.db.ObjectId(entity));
	});

	// check weight
	if (data.hasOwnProperty("weight") && (typeof data.weight === "number")) rel.weight = data.weight;

	// check created
	if (data.hasOwnProperty("created")){
		var d = vali_date_date(data.created);
		if (d.err) return  fn(new Error(d.err));
		rel.created = d.date;
	}

	// check type
	if (!data.hasOwnProperty("type") || typeof data.type !== "string" || data.type === "") return fn(new Error("type is not a string"));
	rel.type = data.type;

	// check tags
	if (data.hasOwnProperty("tags") && data.tags) {
		if (typeof data.tags === "string") data.tags = data.tags.split(/([\,\;]|\s+#)/g);
		if (!(data.tags instanceof Array)) return fn(new Error("tags is not an array"));
		data.tags.map(function(tag){
			// fix tags to trimmed lower case
			return tag.toLowerCase().replace(/\s+/g,'-').replace(/[\s_\-\.]+/g,'-').replace(/^\-+|\-+$/g,'').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/ß/g,'ss').toLowerCase(); // fixme: make this nicer and use linebreaks
		}).filter(function(tag){
			// filter still-invalid tags
			return /^[a-z0-9\-]+$/.test(tag);
		}).map(function(tag){
			// add to object prototype
			rel.tags.push(tag);
		});
	};

	// transfer importer
	if (data.hasOwnProperty("importer") && (typeof data.importer === "string")) rel.importer = data.importer;

	// transfer data 
	// FIXME: make separate function
	if (data.hasOwnProperty("data") && (data.data instanceof Array)){
		data.data.forEach(function(dataset){
			// check dataset
			if (!dataset.hasOwnProperty("key") || (typeof dataset.key !== "string") || dataset.key === "") return;
			if (!dataset.hasOwnProperty("value")) return;
			if (!dataset.hasOwnProperty("desc") || (typeof dataset.desc !== "string")) return;
			if (!dataset.hasOwnProperty("format") || (typeof dataset.format !== "string") || dataset.format === "") return; // FIXME: proper format check
			if (!dataset.hasOwnProperty("auto") || (typeof dataset.auto !== "boolean")) dataset.auto = false;
			if (!dataset.hasOwnProperty("created")) dataset.created = new Date();
			else dataset.created = vali_date_date(dataset.created).date || new Date();
			if (!dataset.hasOwnProperty("updated")) dataset.updated = new Date();
			else dataset.updated = vali_date_date(dataset.updated).date || new Date();
			// assign random id if nessecary
			if (!dataset.hasOwnProperty("id")) dataset.id = crypto.pseudoRandomBytes(32).toString('hex');
			rel.data.push(dataset);
		});
	};
	fn(null, rel);
	return this;
};

// ✓ create relation
api.prototype.rel_create = function(data, fn){
	debug("create relation");
	var self = this;
	self.rel_check(data, function(err, data){
		if (err) return fn(err);
		self.db.collection("relations").save(data, function(err, result){
			if (err) return fn(err);
			debug("relation created: %s", result._id);
			fn(null, result._id);
		});
	});
	return this;
};

// ✓ retrieve relation
api.prototype.rel_get = function(id, fn){
	debug("get relation %s", id);
	var self = this;
	self.db.collection("relations").findOne({_id: self.db.ObjectId(id)}, function(err, result){
		if (!err) debug("got relation %s", id);
		fn(err, result);
	});
	return this;
};

// ✓ delete a relation

api.prototype.rel_delete = function(id, fn){
	debug("delete relation %s", id);
	var self = this;
	self.db.collection("relations").remove({_id: self.db.ObjectId(id)}, true, function(err, result){
		if (!err) debug("deleted relation %s", id);
		fn(err, id);
	});
	return this;
};

// ✓ update a relation
api.prototype.rel_update = function(id, data, fn){
	debug("update relation %s", id);
	var self = this;
	self.rel_check(data, function(err, data){
		if (err) return fn(err);
		self.db.collection("relations").update({_id: self.db.ObjectId(id)}, data, {upsert: true}, function(err, result){
			if (err) return fn(err);
			debug("relation updated: %s", id);
			fn(null, id);
		});
	});
	return this;
};

// ✓ automagically merge relation versions
api.prototype.rel_upmerge = function(id, data, fn){
	debug("upmerge relation %s", id);
	var self = this;
	self.rel_get(id, function(err, a){
		if (err) return fn(err);
		self.rel_check(data, function(err, b){
			if (err) return fn(err);

			// transfer creation date
			b.created = a.created;

			// transfer original importer
			if (a.hasOwnProperty("importer")) b.importer = a.importer;

			// transfer type
			b.type = a.type;

			// transfer tags
			a.tags.forEach(function(tag){
				if (b.tags.indexOf(tag) < 0) b.tags.push(tag);
			});

			// transfer data
			b.data = self.merge_data(b.data, a.data);

			self.rel_update(id, b, function(err, result){

				if (err) return fn(err);

				debug("upmerged relation %s", id);
				fn(null, result);

			});
		});
	});
	return this;
};

// ✓ check if a specific relation exists
api.prototype.rel_exists = function(ent, fn){
	var self = this;
	// convert ids to ObjectId
	ent = ent.map(function(id){
		return self.db.ObjectId(id);
	});

	// get entities
	self.db.collection("relations").find({ "entities": ent }, function(err, result){
		if (err) return fn(err, null);
		if (result.length > 0) return fn(null, result.shift()._id);
		// get entities for reverse order, FIXME: do this in one query, if possible (tried it though, wtf mongodb)
		self.db.collection("relations").find({ "entities": ent.reverse() }, function(err, result){
			if (err) return fn(err, null);
			if (result.length > 0) return fn(null, result[0]._id, result[0]);
			fn(null, null);
		});
	});
};

// ✓ automagically create or extend relations
api.prototype.rel_creaxtend = function(data, fn){
	debug("creaxtend relation %s", data.entities.join(" ↔ "));
	var self = this;

	self.rel_exists(data.entities, function(err, id, rel){
		if (err) return fn(err);

		if (id === null) {
			// create new relation
			self.rel_create(data, fn);
		} else {
			// upmerge existing relation
			self.rel_upmerge(id, data, fn);
		}
 		return this;
	});
};

// ✓ replace entity reference in relations — contains mongodb dark magic
api.prototype.rel_replace = function(a, b, fn){
	var self = this;
	debug("replace relations for %s with %s", a, b);
	self.db.collection("relations").update({
		"entities": { "$in": [self.db.ObjectId(a)] }
	},{
		"$push": { "entities": self.db.ObjectId(b) }
	},{
		"multi": true
	}, function(err, result){
		if (err) return fn(err);
		self.db.collection("relations").update({
			"entities": { "$in": [self.db.ObjectId(a)] }
		},{
			"$pull": { "entities": self.db.ObjectId(a) }
		},{
			"multi": true
		}, function(err, result){
			return fn(err);
		});
	});
	return this;
};

/* * * meta * * */

// ✓ entity types
api.prototype.ent_types = function(fn){
	var self = this;
	self.db.collection("entities").distinct("type", function(err, result){
		if (err) return fn(err);
		fn(null, result);
	});
	return this;
};

// ✓ entity tags
api.prototype.ent_tags = function(fn){
	var self = this;
	self.db.collection("entities").distinct("tags", function(err, result){
		if (err) return fn(err);
		fn(null, result);
	});
	return this;
};

// ✓ relation types
api.prototype.rel_types = function(fn){
	var self = this;
	self.db.collection("relations").distinct("type", function(err, result){
		if (err) return fn(err);
		fn(null, result);
	});
	return this;
};

// ✓ relation tags
api.prototype.rel_tags = function(fn){
	var self = this;
	self.db.collection("relations").distinct("tags", function(err, result){
		if (err) return fn(err);
		fn(null, result);
	});
	return this;
};

/* * * query * * */

// ✓ plugin export
api.prototype.ent_export = function(fn){
	debug("export");
	var self = this;
	var relmap = {};
	self.db.collection("relations").find(function(err, rels){
		if (err) return fn(err);
		rels.forEach(function(rel){
			if (!relmap.hasOwnProperty(rel.entities[0].toString())) relmap[rel.entities[0].toString()] = [[],[]];
			relmap[rel.entities[0].toString()][1].push(rel.entities[1].toString())
			if (!relmap.hasOwnProperty(rel.entities[1].toString())) relmap[rel.entities[1].toString()] = [[],[]];
			relmap[rel.entities[1].toString()][1].push(rel.entities[0].toString())
		});
		self.db.collection("entities").find(function(err,ents){
			if (err) return fn(err);
			ents.forEach(function(ent){
				if (!(relmap.hasOwnProperty(ent._id.toString()))) return;
				relmap[ent._id.toString()][0].push(ent.name);
				ent.aliases.forEach(function(alias){
					relmap[ent._id.toString()][0].push(alias);
				});
				relmap[ent._id.toString()].unshift(ent.type);
			});
			fn(null, relmap);
			debug("exported");
		});
	});
	return self;
};

// ✓ list all entities
api.prototype.ent_list = function(cond, fn){
	var self = this;

	// query object
	var q = {};

	// default on all if non query is given
	if (typeof cond === "function") {
		var fn = cond;
		var cond = {};
	}

	// query for beginning letter
	if (cond.hasOwnProperty("letter")){
		q.search = { "$in": [ new RegExp("(^|\\b)"+cond.letter.toLowerCase(), "i") ] };
	}

	// query for type
	if (cond.hasOwnProperty("type")){
		q.type = cond.type.toLowerCase();
	};

	self.db.collection("entities").find(q, {name: true, type: true, slug: true}).sort({slug: 1}, function(err, result){
		if (err) return fn(err);

		self.rels(function(err, rels){ //FIXME: get ALL the relations? ;)
			result = result.map(function(item){
				item.connections = rels.hasOwnProperty(item._id) ? rels[item._id].length : 0;
				return item;
			});
			fn(null, result);
		});

	});
	return this;
};

// ✓ list all entities
api.prototype.ent_list_full = function(cond, fn){
	var self = this;

	// query object
	var q = {};

	// query for type
	if (cond.hasOwnProperty("type")){
		q.type = cond.type.toLowerCase();
	}

	// search for name
	if (cond.hasOwnProperty("search")) {
		q.name = new RegExp("^" + cond.search, "i");
	}

	// fields object
	var f = {name: true};
	if (cond.hasOwnProperty("fields")){
		cond.fields.split(',').forEach(function(field){
			f[field] = true;
		});
	}
	if (cond.hasOwnProperty("keys")) {
		f.data = true;
	}
	self.db.collection("entities").find(q, f, function(err, result){
		if (err) return fn(err);

		if (cond.hasOwnProperty("keys")) {
			var keys = cond.keys.split(',');
			result.forEach(function(e){
				if (e.data)
					e.data = e.data.filter(function(d){
						return keys.indexOf(d.key) >= 0;
					})
			});
		}
		if (cond.hasOwnProperty("extras")) {
			if (cond.extras.split(',').indexOf('connections') >= 0) {
				return self.rels(function(err, rels){
					result = result.map(function(item){
						item.connections = rels.hasOwnProperty(item._id) ? rels[item._id].length : 0;
						return item;
					});
					fn(null, result);
				});
			}
		}
		fn(null, result);
	});
	return this;
};

// ✓ get all relations 
api.prototype.rels = function(fn){
	debug("all entity relations");
	var self = this;
	self.db.collection("relations").find(function(err, result){
		if (err) return fn(err);
		if (!result || result.length === 0) return fn(null, {});
		var rels = {};
		result.forEach(function(item){
			if (!rels.hasOwnProperty(item.entities[0])) rels[item.entities[0]] = [];
			if (!rels.hasOwnProperty(item.entities[1])) rels[item.entities[1]] = [];
			if (rels[item.entities[0]].indexOf(item.entities[1]) < 0) rels[item.entities[0]].push(item.entities[1]);
			if (rels[item.entities[1]].indexOf(item.entities[0]) < 0) rels[item.entities[1]].push(item.entities[0]);
		});
		fn(null, rels);
	});
	return this;
};

// ✓ get all relations 
api.prototype.rels_full = function(cond, fn){
	debug("all relations");
	var self = this;
	// query object
	var q = {};

	// query for type
	if (cond.hasOwnProperty("type")){
		q.type = cond.type.toLowerCase();
	}

	// fields object
	var f = {name: true, entities:true};
	if (cond.hasOwnProperty("fields")){
		cond.fields.split(',').forEach(function(field){
			f[field] = true;
		});
	}

	if (cond.hasOwnProperty("keys")) {
		f.data = true;
	}

	self.db.collection("relations").find(q, f, function(err, result){
		if (err) return fn(err);
		if (!result || result.length === 0) return fn(null, []);
		if (cond.hasOwnProperty("keys")) {
			var keys = cond.keys.split(',');
			result.forEach(function(e){
				if (e.data)
					e.data = e.data.filter(function(d){
						return keys.indexOf(d.key) >= 0;
					})
			});
		}
		if (cond.hasOwnProperty("extras")) {
			if (cond.extras.split(',').indexOf('name') >= 0) {
				return self.db.collection("entities").find({}, {name: true}, function (err, entities) {
					if (err) return fn(err);
					var ents = {};
					entities.forEach(function (item) {
						ents[item._id.toString()] = item;
					});
					result.forEach(function (item) {
						var e = ents[item.entities[0].toString()];
						if (e) item.name = e.name;
						e = ents[item.entities[1].toString()];
						if (e) item.name += ' | ' + e.name;
					});
					fn(null, result);
				});
			}
		}
		fn(null, result);
	});
	return this;
};

// ✓ get all relations for an entity
api.prototype.ent_rels = function(id, fn){
	debug("entity relations for %s", id);
	var self = this;
	self.db.collection("relations").find({"entities": { "$in": [self.db.ObjectId(id)] }}, function(err, result){
		if (err) return fn(err);
		if (!result || result.length === 0) return fn(null, null);
		var reqs = 0;
		result.forEach(function(rel){
			rel.entities.filter(function(entid){
				return (entid.toString() !== id.toString());
			}).forEach(function(entid){
				reqs++;
				self.db.collection("entities").findOne({_id: self.db.ObjectId(entid)}, {name: true, slug: true}, function(err, entity){
					if (!err && entity) {
						debug("got related entity %s", entity._id);
						rel.entity = entity;
					};
					if (--reqs === 0) fn(null, result);
				});
			});
		});
	});
	return this;
};

// ✓ find entity by match
api.prototype.ent_match = function(ent, fn){
	//FIXME: improve this.
	debug("get entity by name %s", ent.name);
	var self = this;
	self.db.collection("entities").find({type: ent.type, search: {"$in": self.ent_unify(ent)}}, function(err, result){
		if (err) return fn(null, null);
		if (!result || result.length === 0) return fn(null, null);
		if (result.length > 1) {
			debug("ent_match: found multiple results (%d) for %s with %s", result.length, ent.name, JSON.stringify(self.ent_unify(ent)));
			return fn(new Error("found multiple results")); // FIXME
		}
		if (!err) debug("get entity by name %s", result[0].name);
		fn(err, result[0]);
	});
	return this;
};

// ❗ find entity 
api.prototype.ent_find = function(query, fn){
	debug("find entity");
	var self = this;

	var q = {};
	//FIXME: magic transformation from string-query to mongo-query

	self.db.collection("entities").find(q, function(err, result){
		if (err) return fn(err);
		//FIXME: sort?
		fn(null, result);
	});
	return this;
};

// ✓ get a list of all tags
api.prototype.tags = function(type, fn){
	var self = this;
	var type = (type === "entities") ? "entities": "relations";
	debug("request tags", type);
	self.db.collection(type).distinct('tags', function(err, result){
		result = result.filter(function(r){
			return r !== null;
		});
		if (!err) debug("tags collected");
		fn(err, result);
	});
};

/* backend users  */

// ✓ create backend user
api.prototype.user_create = function(user, fn){
	debug("create user %s", user.name);
	if (!user.name || (!user.name.length)) return fn("username needed");
	if (!user.pass || (!user.pass.length)) return fn("password needed");
	var self = this;
	self.user_find(user.name, function(err, u){
		if (u) return fn("user exists");
		self.db.collection("users").save({
			name: user.name,
			pass: user.pass,
			admin: user.admin==true
		}, function (err, result) {
			if (!err) debug("created user %s", user.name);
			fn(err, result);
		});
	});
};

// ✓ find user by name
api.prototype.user_find = function(name, fn){
	debug("get user %s", name);
	var self = this;
	self.db.collection("users").findOne({name: name}, function(err, result){
		if (!err) debug("got user %s", name);
		fn(err, result);
	});
};

// ✓ get user by id
api.prototype.user_get = function(id, fn){
	debug("get user %s", id);
	var self = this;
	self.db.collection("users").findOne({_id: self.db.ObjectId(id)}, function(err, result){
		if (!err && result) debug("got user %s", result.name);
		fn(err, result);
	});
};

// ✓ update user
api.prototype.user_update = function(id, user, fn){
	debug("update user %s", id);
	var self = this;
	self.user_get(id, function(err, result){
		if (err) return fn(err);
		if (!result) return fn("user not found");
		result.name = user.name;
		if (user.pass && (user.pass.length>0))
			result.pass = user.pass;
		result.admin = user.admin==true;
		self.db.collection("users").update({_id: self.db.ObjectId(user._id)}, result, {upsert: true}, function(err, result){
			if (err) return fn(err);
			debug("user updated: %s", user._id);
			fn(null, result);
		});
	});
};

// ✓ delete user
api.prototype.user_delete = function (id, fn){
	debug("delete user %s", id);
	var self = this;
	self.db.collection("users").remove({_id: self.db.ObjectId(id)}, true, function (err, res) {
		if (!err) debug("user %s deleted", id);
		fn(err);
	});
};

// ✓ authenticate user with name/pass
api.prototype.user_auth = function(name, pass, fn){
	debug("auth user %s", name);
	var self = this;
	self.db.collection("users").findOne({name: name}, function(err, result){
		if ((!result) || (result.pass !== pass)) return fn(null,null);
		if (!err) debug("auth'd user %s", name);
		fn(err, result);
	});
};

// ✓ list all users
api.prototype.user_list = function (fn){
	debug("list users");
	var self = this;
	self.db.collection("users").find(function (err, results) {
		fn(err, results);
	});
};

/* field types  */

// ✓ create field
api.prototype.field_create = function(field, fn){
	debug("create field %s", field.name);
	if (!field.name || (!field.name.length)) return fn("field name needed");
	if (!field.key || (!field.key.length)) return fn("field key needed");
	if (!field.format || (!field.format.length)) return fn("field type needed");
	if (!field.mode || (!field.mode.length)) return fn("field mode needed");
	var self = this;
		self.db.collection("fields").save({
			name: field.name,
			key: field.key,
			format: field.format,
			mode: field.mode,
		}, function (err, result) {
			if (!err) debug("created field %s", field.name);
			fn(err, result);
		});
};

// ✓ get field
api.prototype.field_get = function(id, fn){
	debug("get field %s", id);
	var self = this;
	self.db.collection("fields").findOne({_id: self.db.ObjectId(id)}, function(err, result){
		if (!err && result) debug("got field %s", result.name);
		fn(err, result);
	});
};

// ✓ update field
api.prototype.field_update = function(id, field, fn){
	debug("update field %s", id);
	var self = this;
	self.field_get(id, function(err, result){
		if (err) return fn(err);
		if (!result) return fn("field not found");

		if (field.name && (field.name.length>0))
			result.name = field.name;
		if (field.format && (field.format.length>0))
			result.format = field.format;
		if (field.key && (field.key.length>0))
			result.key = field.key;
		if (field.mode && (field.mode.length>0))
			result.mode = field.mode;

		self.db.collection("fields").update({_id: self.db.ObjectId(field._id)}, result, {upsert: true}, function(err, result){
			if (err) return fn(err);
			debug("field updated: %s", field._id);
			fn(null, result);
		});
	});
};

// ✓ delete field
api.prototype.field_delete = function (id, fn){
	debug("delete field %s", id);
	var self = this;
	self.db.collection("fields").remove({_id: self.db.ObjectId(id)}, true, function (err, res) {
		if (!err) debug("field %s deleted", id);
		fn(err);
	});
};

// ✓ list fields
api.prototype.field_list = function (mode, fn){
	debug("list fields");
	var self = this;
	var q = {};
	if (mode)
		q.mode = mode;
	self.db.collection("fields").find(q).sort({name: 1},function (err, results) {
		fn(err, results);
	});
};

module.exports = api;
