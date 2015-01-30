### `purge(importer, callback(err))`

Remove all entries by a specified `importer` from database:

### `unify(str)`

return simple representation of `string`

### `ent_unify(ent)`

Unify name and aliases of entity `ent` and return `ent` object

### `merge_data(a, b)`

Return merged data sets `a` and `b`

### `ent_check(ent, callback(err, ent))`

Check entity object `ent`
This is of course automatically called by other methods.

### `ent_create(ent, callback(err, id))`

Create a new entity `ent`

### `ent_get(id, callback(err, ent))`

Retrieve an entity identified by `id`

### `ent_delete(id, callback(err))`

Delete an entity identified by `id` and all it's relations

### `ent_update(id, ent, callback(err, id))`

Replace an entity identified by `id` with `ent`

### `ent_merge([id, id], callback(err, id))`

Merge two entities identified by `id`

_Not implemented yet_

### `ent_split(id, [[ent, [relid, ...]], [[ent, [relid, ...]]], callback(err, [id, id]))`

Split an entity identified by `id` into two separate entities

_Not implemented yet_

### `ent_upmerge(id, ent, callback(err, id))`

Automagically update an entity identified by `id` with new data from `ent`

### `ent_creaxtend(ent, callback(err, id))`

If an entity with matching `name` or `aliases` is found, upmerge it with `ent`, otherise create new entity `ent`
This is used by importers.

### `rel_check(data, callback(err, rel))`

Check a relation. This is of course automatically called by other methods.

### `rel_create(rel, callback(err, id))`

Create a new relation `rel`

### `rel_get(id, callback(err, rel))`

Retrieve relation identified by `id`

### `rel_delete(id, callback(err, id))`

Delete relation identified by `id`

### `rel_update(id, rel, callback(err, id))`

Replace a relation identified by `id` with `rel`

### `rel_upmerge(id, rel, callback(err, id))`

Automagically update a relation identified by `id` with new data from `rel`

### `rel_exists([entid, entid], callback(err, id))`

Check if a specific relation between entities identified by `entid` exists.

### `rel_creaxtend(rel, callback)`

If an entity with matching `rel.entities` is found, upmerge it with `rel`, otherwise create new relation `rel`
This is used by importers.

### `ent_types(callback(err, [type, type, ...]))`

Retrieve an array of distinct `type` property of all entities.

### `ent_tags(callback(err, [tag, tag, ...]))`

Retrieve an array of distinct `tags` of all entities.

### `rel_types(callback)`

Retrieve an array of distinct `type` property of all relations.

### `rel_tags(callback)`

Retrieve an array of distinct `tags` of all relations.

### `ent_export(callback(err, map))`

Retrieve a minimal representation of all entities with their relations.

### `ent_list(cond, callback(err, [ent, ...]))`

Retrieve an array of all Entities matching the conditions in `cond`

``` javascript
{
	letter: "a", 			// match words starting with a specific letter
	words: "some words",	// match against words
	type: "entity"			// match a certein type
}
```

### `ent_list_full(cond, callback)`

Retrieve an array of all Entities matching the conditions in `cond`

``` javascript
{
	type: "entity",			// match a certein type
	search: "substr",			// match a certain string
	fields: "prop1,prop2",	// include certain object properties
	keys: "field,field",		// include certain data fields
	extras: "connections"	// include number of relations
}
```

### `rels(callback(err, {entid: [entid, ...], ...}))`

Retrieve an object of entity id pairs which have relations to each other.

### `rels_full(cond, callback(err, [rel, ...]))`

Retrieve an array of all relations matching the conditions in `cond`

``` javascript
{
	type: "executive",		// match a certein type
	search: "substr",			// match a certain string
	fields: "prop1,prop2",	// include certain object properties
	keys: "field,field",		// include certain data fields
	extras: "name"				// include names of related entities
}
```

### `ent_rels(id, callback(err, [rel, ...]))`

Retrieve all relations for an entity identified by `id`

### `ent_match(ent, callback(err, id)`

Find a single entity with matching `ent.name` or `ent.aliases`

### `ent_find(query, callback(err, [ent, ...]))`

Find entities by query.

_Not implemented yet_

### `tags(type, callback) `

Retrieve an array of distinct `tags` of all relations and entities.

### `user_create(user, callback(err, user))`

Create a backend user

### `user_find(name, callback(err, user))`

Get backend user by `name`

### `user_get(id, callback(err, user))`

Get backend user by `id`

### `user_update(id, user, callback(err, user))`

Replace backend user identified by `id` with `user`

### `user_delete (id, callback(err))`

Delete backend user identified by `id`

### `user_auth(name, pass, callback(err, user))`

Retrieve user identified by `name` if password matching `pass`

### `user_list (callback(err, [user, ...])) `

List all backend users

### `field_create(field, callback)` _tbd_

Create field

### `field_get(id, callback)` _tbd_

Get field


### `field_update(id, field, callback)` _tbd_

Update field


### `field_delete (id, callback)` _tbd_

Delete field


### `field_list (mode, callback)` _tbd_

List fields
