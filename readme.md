# Lobbyradar

## Todo

* check data consistency
	* orphaned relations
	* prename/surname mixup from import
	* double data sets from different imports
* complex search interface
* creaxtend relation type consitency
* relation aggregation
* suggestion api
* updates api
* whitelist backend api

## Cached Data

For high load environments, results may be cached as staic files:

* `/api/plugin/whitelist` — [/assets/cache/whitelist.json](/assets/cache/whitelist.json) and [/assets/cache/whitelist.json.gz](/assets/cache/whitelist.json.gz)
* `/api/plugin/export` — [/assets/cache/entities.json](/assets/cache/entities.json) and [/assets/cache/entities.json.gz](/assets/cache/entities.json.gz)

Their use is recommended and may be enforced. Those files are recreated in an interval of 5 minutes. 

## HTTP API

### `GET /api/plugin/whitelist`

Get domain whitelist for plugin

### `GET /api/plugin/export`

Get entity export for plugin

### `GET /api/search?q={query}`

Search entities and relations. __to be implemented__

### `GET /api/autocomplete?q={query}`

Fast entity autocompletion search by names and aliases

### `GET /api/entity/get/{id}?relations=true`

Get data for an entity specified by `id`. Include relations if `relations` parameter is set.

### `GET /api/entity/list?letter={letter|}&words={words|}&type={person|entity|}` _deprecated_

List all entities specified by starting `letter`, containing `words` and matching `type`

### `GET /api/entity/types`

List entity types

### `GET /api/entity/tags`

List entity tags

### `GET /api/entity/export` _deprecated, use `/api/plugin/export` instead_

Export entities as subset of entities containing entity type, name, aliases and relations in minimalized form.

``` javascript
{
	id: [							// entity id
		type,						// entity type
		[name, alias, ...],	// name and aliases
		[id, ...]				// ids of related entities
	]
}
``` 

### `GET /api/relation/types`

List relation types

### `GET /api/relation/tags`

List relation tags

### `GET /api/relation/list`

List all relations

## Data API

See [api.md](./api.md)

## Data Structure

### Entity Object

``` javascript
{
	_id: id,	// mongodb id
	importer: "str", // importer string
	created: (new Date()), // date object
	updated: (new Date()), // date object
	type: "person", // string
	tags: ["tag"], // array of strings
	name: "Name", // string
	slug: "name", // ascii representation of name
	aliases: ["Name", "Alt. Name"], // array of strings
	data: [{
		id: id, // ObjectID()
		key: "address",
		value: {what:ever},
		desc: "Description",
		format: "address", // string, number, address, list, date, ...
		auto: true,
		created: (new Date()), // date object
		updated: (new Date()) // date object
	}],
	search: [
		"name",
		"alt name"
	] // searchable ascii representations of name and aliases
}
``` 

### Relation

``` javascript
{
	_id: id, // mongodb id
	importer: "str", // importer string
	created: (new Date()), // date object
	updated: (new Date()), // date object
	entities: [id, id], // from, to; mongodb ids
	type: "employee", // string
	tags: ["tag"], // array of strings
	weight: 0, // float, 0..1
	data: [{
		id: id, // ObjectID()
		key: "address",
		value: {what:ever},
		desc: "Description",
		format: "address", // string, number, address, list, date, ...
		auto: true,
		created: (new Date()), // date object
		updated: (new Date()) // date object
	}]
}
``` 

