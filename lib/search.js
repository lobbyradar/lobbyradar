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
	self.datatypes = {};

	// reindexing
	self.index();
	self.reindex = setInterval(function(){
		self.index();
	}, self.opt.reindex);

	return this;
};

search.prototype.autocomplete = function(str, fn){
	var self = this;
	fn(null, self.trie.get(str));
};

search.prototype.autocomplete = function(str, fn){
	var self = this;
	var res = self.trie.get(str);
	console.log(res);
	fn(null, res);
};

search.prototype.datatypes = function(fn){
	
};

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

			// autocomplete index
			result.forEach(function(item){

				self.trie.add({
					id: item._id,
					name: item.name,
					aliases: item.aliases,
					relations: (self.rels.hasOwnProperty(item._id) ? self.rels[item._id].length : 0)
				});
				
				// data type index
				
			});
			
			// data property index

			debug("ent indexing done");
			fn(null);
		});		
	});
	return this;
};

module.exports = search;
