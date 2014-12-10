#!/usr/bin/env node

function api(opt){
	if (!(this instanceof api)) return new api(opt);
	return this;
};

/* * * entity operations * * */

// create a relation
api.prototype.ent_create = function(data, fn){
	var self = this;
	return this;
};

// retrieve a relation
api.prototype.ent_get = function(id, fn){
	var self = this;
	return this;
};

// update a relation
api.prototype.ent_update = function(id, data, fn){
	var self = this;
	return this;
};

// delete a relation and all relations
api.prototype.ent_delete = function(id, fn){
	var self = this;
	return this;
};

// merge n entities
api.prototype.ent_merge = function(ids, fn){
	var self = this;
	return this;
};

// split entity into two (and create horcrux)
api.prototype.ent_split = function(id, a, b, fn){
	var self = this;
	return this;
};

// automagically upsert entity
api.prototype.ent_magic = function(data, fn){
	var self = this;
	return this;
};

/* * * relation operations * * */

// create relation
api.prototype.rel_create = function(data, fn){
	var self = this;
	return this;
};

// retrieve relation
api.prototype.rel_get = function(id, fn){
	var self = this;
	return this;
};

// update a relation
api.prototype.rel_update = function(id, data, fn){
	var self = this;
	return this;
};

// delete a relation
api.prototype.rel_delete = function(id, fn){
	var self = this;
	return this;
};

/* * * meta * * */

api.prototype.ent_types = function(id, fn){
	var self = this;
	return this;
};

api.prototype.rel_types = function(id, fn){
	var self = this;
	return this;
};

/* * * query * * */

api.prototype.rel_ents = function(id, fn){
	var self = this;
	return this;
};

module.exports = api;
