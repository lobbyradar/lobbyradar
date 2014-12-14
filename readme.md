# Lobbyradar

## API

### `ent_check(ent, callback)`

Check an entity. This is of course automatically called by other methods.

### `ent_create(ent, callback)`

Create a new entity

### `ent_delete(id, callback)`

Delete an entity and all relations

### `ent_update(id, ent, callback)`

Fully replace an entity with a new version. Use with care.

### `ent_merge(ent, callback)`

Merge two entities

_not implemented yet_

### `ent_split(id, a, b, bcallback)`

Split an entity into two

_not implemented yet_

### `ent_upmerge(id, ent, callback)`

Extend an entity with new data.

### `ent_types(callback)`

List all distinct entity types

### `ent_tags(callback)`

List all distinct entity tags

### `ent_rels(id, callback)`

Get all relations for an entity

### `rel_check(rel, callback)`

Check a relation. This is of course automatically called by other methods.

### `rel_create(rel, callback)`

Create a new relation

### `rel_delete(id, callback)`

Delete a relation.

### `rel_update(id, rel, callback)`

Fully replace a relation with a new version. Use with care.

### `rel_upmerge(id, rel, callback)`

Extend a relation with new data.

### `rel_types(callback)`

List all distinct relation types

### `rel_tags(callback)`

List all distinct relation tags

## Data Structure

### Entity Object

``` javascript
{
	_id: id,	// mongodb id
	created: (new Date()), // date object
	updated: (new Date()), // date object
	type: "person", // string
	tags: ["tag"], // array of strings
	name: "Name", // string
	aliases: ["Name", "Alt. Name"], // array of strings
	data: [{
		"key": "address",
		"value": {what:ever},
		"desc": "Description",
		"format": "address", // string, number, address, list, date, ...
		"auto": true,
		created: (new Date()), // date object
		updated: (new Date()) // date object
	}],	
	sources: [{
		url: "",
		created: (new Date()),
		updated: (new Date()),
		remark: "" // string
	}]
}
``` 

### Relation

``` javascript
{
	id: id, // mongodb id
	created: (new Date()), // date object
	updated: (new Date()), // date object
	entities: [id, id], // from, to; mongodb ids
	type: "employee", // string
	tags: [""], // array of strings
	weight: 0, // float, 0..1
	data: [{
		"key": "address",
		"value": {what:ever},
		"desc": "Description",
		"format": "address", // string, number, address, list, date, ...
		"auto": true,
		created: (new Date()), // date object
		updated: (new Date()) // date object
	}],
	sources: [{ 
		url: "",
		created: (new Date()), // date object
		updated: (new Date()), // date object
		remark: ""
	}]
}
``` 

