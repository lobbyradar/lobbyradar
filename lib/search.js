#!/usr/bin/env node

var debug = require("debug")("search");
var trie = require("trie-search");
var slug = require("slug");
var uniq = require("unq");
var dur = require("dur");

function search(opt, api){

	if (!(this instanceof search)) return new search(opt, api);
	var self = this;

	self.opt = opt||{};
	self.opt.reindex = (self.opt.hasOwnProperty("reindex") && self.opt.reindex) ? dur(self.opt.reindex) : dur("5m");

	self.api = api;
	self.trie = new trie(['name', 'aliases'], {min: 3, indexField: 'id'});

	self.rels = {};
	self.reltypes = [];
	self.dtindex = {};
	self.ftindex = {};

	// reindexing
	self.reindex(function(err){
		if (err) debug("ERR: %s", err);
	});
	(setInterval(function(){
		self.reindex();
	}, self.opt.reindex)).unref();

	return this;
};

// ✓ entity autocomplete
search.prototype.autocomplete = function(str, fn){
	var self = this;
	fn(null, self.trie.get(str));
	return this;
};

// find route between entities
search.prototype.route = function(fn){};

// search in data types
search.prototype.entsearch = function(fn){
	
};

// search for relations
search.prototype.relsearch = function(fn){
	
};

// search in data types
search.prototype.datasearch = function(q, fn){
	
};

// ✓ all types of relations
search.prototype.reltypes = function(fn){
	var self = this;
	fn(null, self.reltypes);
	return this;
};

// ✓ all data type sets
search.prototype.datatypes = function(fn){
	var self = this;
	fn(null, self.dtindex);
	return this;
};

// ✓ array of field types
search.prototype.fieldtypes = function(fn){
	var self = this;
	fn(null, self.ftindex);
	return this;
};

// ✓ reindex search data
search.prototype.reindex = function(fn){
	var self = this;
	if (typeof fn !== "function") var fn = function(){};

	// get relations for index
	self.api.rels(function(err, rels){
		if (err) debug("rel index error: %s", err);
		if (err) return fn(err);
		self.rels = rels;
		
		// get entities for index
		self.api.ents(function(err, ents){
			if (err) debug("[reindex] ent index error: %s", err);
			if (err) return fn(err);
			
			// rel indexing
			self.api.rels_full(function(err, rels){
				if (err) debug("[reindex] rel index error: %s", err);
				if (err) return fn(err);
			
				self.trie.reset();

				// temporary data type index
				var _dtindex = {};
				var _ftindex = {};
				var _reltypes = {};

				// autocomplete index
				debug("[reindex] preparing entities");
				ents.forEach(function(item){

					self.trie.add({
						id: item._id,
						name: item.name,
						aliases: item.aliases,
						relations: (self.rels.hasOwnProperty(item._id) ? self.rels[item._id].length : 0)
					});
				
					// data type index
					item.data.forEach(function(d){
						if (d.value !== null && typeof d.value === "object") {
							Object.keys(d.value).forEach(function(k){
								// add to data type index
								_dtindex[[item.type, d.key+"."+k, d.format].join("-")] = {
									key: d.key+"."+k,
									name: d.desc,
									format: d.format,
									mode: item.type
								};
							});
						} else {
							// add to data type index
							_dtindex[[item.type, d.key, d.format].join("-")] = {
								key: d.key,
								name: d.desc,
								format: d.format,
								mode: item.type
							};
						}

						// field type index
						if (!_ftindex.hasOwnProperty(d.format)) _ftindex[d.format] = true;

					});

				});
				
				debug("[reindex] preparing relations");
				rels.forEach(function(item){

					// data type index
					item.data.forEach(function(d){
						if (d.value !== null && typeof d.value === "object") {
							Object.keys(d.value).forEach(function(k){
								// add to data type index
								_dtindex[[item.type, d.key+"."+k, d.format].join("-")] = {
									key: d.key+"."+k,
									name: d.desc,
									format: d.format,
									mode: item.type
								};
							});
						} else {
							// add to data type index
							_dtindex[[item.type, d.key, d.format].join("-")] = {
								key: d.key,
								name: d.desc,
								format: d.format,
								mode: item.type
							};
						}
						
						// field type index
						if (!_ftindex.hasOwnProperty(d.format)) _ftindex[d.format] = true;

					});
					
					// relation type index
					if (!_reltypes.hasOwnProperty(item.type)) _reltypes[item.type] = true;

				});
						
				// make unique data type index
				debug("[reindex] reindexing data type index");
				self.dtindex = Object.keys(_dtindex).map(function(k){ return _dtindex[k]; }).sort(function(a,b){
					return (a.key.localeCompare(b.key));
				});
				self.ftindex = Object.keys(_ftindex);
				self.reltypes = Object.keys(_reltypes);
				
			});
		});		
	});
	return this;
};

module.exports = search;
