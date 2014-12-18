#!/usr/bin/env node

var validator = require("validator");
var moment = require("moment");
var debug = require("debug")("api");
var slug = require("slug");

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
	
		//FIXME: relation indexes
	
		self.ready = true;
	});

	self.db.on('error',function(err) {
		debug("database error: %s", err);
	});
	
	return this;
};

/* * * helpers * * */

// ✓ drop database
api.prototype.reset = function(safephrase, fn){
	var self = this;
	if (safephrase === "i know what i am doing") self.db.dropDatabase(function(){
		debug("database dropped");
		fn();
	});
	return this;
};

// ✓ simple representation of string
api.prototype.unify = function(str){
	return slug(str, " ").toLowerCase();
};

// ✓ unify name and aliases of entity
api.prototype.ent_unify = function(ent){
	var self = this;
	var result = [];

	// fix string-only entities
	if (typeof ent === "string") ent = {name: ent};

	// add name
	result.push(self.unify(ent.name));

	// add aliases if present
	if (ent.hasOwnProperty("aliases")) ent.aliases.forEach(function(alias){
		result.push(self.unify(alias));
	});
	
	// filter empty strings
	return result.filter(function(q){
		return (typeof q === "string" && q.replace(/\s+/g,'') !== "");
	});

};

/* * * entity operations * * */

// ✓ check entity
api.prototype.ent_check = function(data, fn){
	var self = this;
	
	// entity prototype
	var ent = {
		name: null,
		slug: null,
		created: (new Date()),
		updated: (new Date()),
		type: null,
		tags: [],
		aliases: [],
		data: [],
		sources: [],
		search: []
	};
	
	// check created
	if (data.hasOwnProperty("created")){
		if (!(data.created instanceof Date)) return fn(new Error("created is not a Date object"));
		ent.created = data.created;
	};

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

	// transfer data // FIXME: make separate function
	if (data.hasOwnProperty("data") && (data.data instanceof Array)){
		data.data.forEach(function(dataset){
			// check dataset
			if (!dataset.hasOwnProperty("key") || (typeof dataset.key !== "string") || dataset.key === "") return;
			if (!dataset.hasOwnProperty("value")) return;
			if (!dataset.hasOwnProperty("desc") || (typeof dataset.desc !== "string")) return;
			if (!dataset.hasOwnProperty("format") || (typeof dataset.format !== "string") || dataset.format === "") return; // FIXME: proper format check
			if (!dataset.hasOwnProperty("auto") || (typeof dataset.auto !== "boolean")) dataset.auto = false; 
			if (!dataset.hasOwnProperty("created") || !(dataset.created instanceof Date)) dataset.created = new Date(); 
			if (!dataset.hasOwnProperty("updated") || !(dataset.updated instanceof Date)) dataset.updated = new Date(); 
			ent.data.push(dataset);
		});
	};
	
	// transfer sources
	if (data.hasOwnProperty("sources") && (data.sources instanceof Array)){
		ent.sources = data.sources.map(function(source){
			if (!source.hasOwnProperty("created") || (!(source.created instanceof Date))) source.created = new Date();
			if (!source.hasOwnProperty("updated") || (!(source.updated instanceof Date))) source.updated = new Date();
			if (!source.hasOwnProperty("remark") || typeof source.remark !== "string") source.remark = "";
			return source;
		}).filter(function(source){
			return (source && source.hasOwnProperty("url") && validator.isURL(source.url, {protocols: ["http","https"], require_tld: true, require_protocol: true, allow_underscores: false}));
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
			fn(null, result._id);
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

// merge n entities
api.prototype.ent_merge = function(ids, data, fn){
	var self = this;
	//FIXME: implement this
	return this;
};

// split entity into two (and create horcrux)
api.prototype.ent_split = function(id, a, b, fn){
	var self = this;
	//FIXME: implement this too
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
			
			// transfer data //FIXME: filter double data and don't overwrite manually set data
			b.data = a.data.concat(b.data);
			
			// transfer sources
			a.sources.forEach(function(source){
				if (b.sources.filter(function(s){
					return (s.url === source.url);
				}).length === 0) b.sources.push(source);
			});

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
				self.ent_create(ent, fn);
			} else {
				// merge!
				self.ent_upmerge(result._id, ent, function(err, result_id){
					if (err || !result_id) {
						console.log("ERR", err, result, ent, result_id);
						process.exit();
					}
					fn(err, result_id);
				});
			}
		});
		return this;
	});
};

/* * * relation operations * * */

// ✓ check relation
api.prototype.rel_check = function(data, fn){
	var self = this;

	// relation prototype
	var rel = {
		created: (new Date()),
		updated: (new Date()),
		type: null,
		weight: 0,
		entities: [],
		tags: [],
		sources: [],
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
		if (!(data.created instanceof Date)) return fn(new Error("created is not a Date object"));
		rel.created = data.created;
	};
	
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
	
	// transfer data // FIXME: make separate function
	if (data.hasOwnProperty("data") && (data.data instanceof Array)){
		data.data.forEach(function(dataset){
			// check dataset
			if (!dataset.hasOwnProperty("key") || (typeof dataset.key !== "string") || dataset.key === "") return;
			if (!dataset.hasOwnProperty("value")) return;
			if (!dataset.hasOwnProperty("desc") || (typeof dataset.desc !== "string")) return;
			if (!dataset.hasOwnProperty("format") || (typeof dataset.format !== "string") || dataset.format === "") return; // FIXME: proper format check
			if (!dataset.hasOwnProperty("auto") || (typeof dataset.auto !== "boolean")) dataset.auto = false; 
			if (!dataset.hasOwnProperty("created") || !(dataset.created instanceof Date)) dataset.created = new Date(); 
			if (!dataset.hasOwnProperty("updated") || !(dataset.updated instanceof Date)) dataset.updated = new Date(); 
			rel.data.push(dataset);
		});
	};	
	
	// transfer sources
	if (data.hasOwnProperty("sources") && (data.sources instanceof Array)){
		rel.sources = data.sources.map(function(source){
			if (!source.hasOwnProperty("created") || (!(source.created instanceof Date))) source.created = new Date();
			if (!source.hasOwnProperty("updated") || (!(source.updated instanceof Date))) source.updated = new Date();
			if (!source.hasOwnProperty("remark") || typeof source.remark !== "string") source.remark = "";
			return source;
		}).filter(function(source){
			return (source && source.hasOwnProperty("url") && validator.isURL(source.url, {protocols: ["http","https"], require_tld: true, require_protocol: true, allow_underscores: false}));
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

// ✓ cretrieve relation
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
		fn(err, result);
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

			// transfer type
			b.type = a.type;
			
			// transfer tags
			a.tags.forEach(function(tag){
				if (b.tags.indexOf(tag) < 0) b.tags.push(tag);
			});
			
			// transfer data //FIXME: filter double data and don't overwrite manually set data
			b.data = a.data.concat(b.data);
			
			// transfer sources
			a.sources.forEach(function(source){
				if (b.sources.filter(function(s){
					return (s.url === source.url);
				}).length === 0) b.sources.push(source);
			});
			
			self.rel_update(id, b, function(err, result){
				
				if (err) return fn(err);
				
				debug("upmerged relation %s", id);
				fn(null, result);
				
			});
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
	if (typeof q === "function") {
		var fn = q;
		var cond = {};
	};
	
	// query for beginning letter
	if (cond.hasOwnProperty("letter")){
		q.search = { "$in": [ new RegExp("^"+cond.letter.toLowerCase(), "i") ] };
	};
	
	// query for type
	if (cond.hasOwnProperty("type")){
		q.type = cond.type.toLowerCase();
	};
	
	self.db.collection("entities").find(q, {name: true, type: true, slug: true}).sort({slug: 1}, function(err, result){
		if (err) return fn(err);
		//FIXME: relation count? sort?
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
		if (result.length > 1) return fn(new Error("found multiple results")); // FIXME
		if (!err) debug("get entity by name %s", result[0].name);
		fn(err, result[0]);
	});
	return this;
};

module.exports = api;
