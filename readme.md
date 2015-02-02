# Lobbyradar

## Todo

* match address formats
* put original name into people field

## HTTP API

### `GET /api/search?q={query}`

Search Entities by names and aliases

### `GET /api/autocomplete?q={query}`

Fast entity autocompletion search by names and aliases

### `GET /api/entity/get/{id}?relations=true`

Get data for an entity specified by `id`. Include relations if `relations` parameter is set.

### `GET /api/entity/list?letter={letter|}&words={words|}&type={person|entity|}`

List all entities specified by starting `letter`, containing `words` and matching `type`

### `GET /api/entity/types`

List entity types

### `GET /api/entity/tags`

List entity tags

### `GET /api/entity/export`

Export entities as subset of 

{"54c71ad952d7180000c4d68f":["person",["Elvira Drobinski-Weiß","Elvira Drobinski-Weiß"],["54c906fbb10251e22a64a57d","54c71adb52d7180000c4d882","54c71adb52d7180000c4d889","54c71adb52d7180000c4d896","54c71adb52d7180000c4d898","54c71adb52d7180000c4d88a","54bd232aeccdc50000052328","54c71adc52d7180000c4d8e0","54c71adf52d7180000c4d97d","54cb80ad23abb47ea0fd3b37","54cb80ad23abb47ea0fd3b38"]]

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

