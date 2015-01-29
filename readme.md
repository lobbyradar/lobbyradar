# Lobbyradar

## Todo

* match address formats
* put original name into people field

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

