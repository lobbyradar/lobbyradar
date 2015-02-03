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
	self.dtindex = {};
	self.ftindex = {};

	// reindexing
	self.index();
	self.reindex = setInterval(function(){
		self.index();
	}, self.opt.reindex);

	return this;
};

// entity autocomplete
search.prototype.autocomplete = function(str, fn){
	var self = this;
	fn(null, self.trie.get(str));
	return this;
};

// all data type sets
search.prototype.datatypes = function(fn){
	var self = this;
	fn(null, self.dtindex);
	return this;
};

// array of field types
search.prototype.fieldtypes = function(fn){
	var self = this;
	fn(null, self.ftindex);
	return this;
};

// reindex search data
search.prototype.index = function(fn){
	var self = this;
	if (typeof fn !== "function") var fn = function(){};

	// get relations for index
	self.api.rels(function(err, rels){
		if (err) debug("rel index error: %s", err);
		if (err) return fn(err);
		self.rels = rels;
		
		// get entities for index
		self.api.ents(function(err, result){
			if (err) debug("ent index error: %s", err);
			if (err) return fn(err);
			self.trie.reset();

			// temporary data type index
			var _dtindex = [];
			var _ftindex = {};

			// autocomplete index
			result.forEach(function(item){

				self.trie.add({
					id: item._id,
					name: item.name,
					aliases: item.aliases,
					relations: (self.rels.hasOwnProperty(item._id) ? self.rels[item._id].length : 0)
				});
				
				// data type index
				item.data.forEach(function(d){
					_dtindex.push(JSON.stringify({
						key: d.key,
						name: d.desc,
						format: d.format,
						mode: item.type
					}));
				});
				
				// field type index
				if (!_ftindex.hasOwnProperty(d.format)) _ftindex[d.format] = true
				
			});
			
			// FIXME: rel indexing
			
			// make unique data type index
			self.dtindex = uniq(_dtindex).map(function(d){ return JSON.parse(d); }).sort(function(a,b){
				return (a.key.localeCompare(b.key));
			});
			self.ftindex = Object.keys(_ftindex);

			debug("ent indexing done");
			fn(null);
		});		
	});
	return this;
};

module.exports = search;
