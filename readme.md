# Lobbyradar

## API

crud entity

crud relation

### Entity

{
	id: 1,
	created: "",
	updated: "",
	type: person,
	tags: [""],
	name: "Name",
	aliases: ["Name", "Alt. Name"],
	data: {
		k: v,
		k: v
	},
	sources: [{
		url: "",
		created: "",
		updated: "",
		remark: ""
	}],
	relations: [1,2,3]
}

### Relation

{
	id: 1,
	created: "",
	updated: "",
	entities: [],
	type: "employee",
	tags: [""],
	weight: 0,
	sources: [{
		url: "",
		created: "",
		updated: "",
		remark: ""
	}],
	data: {
		k: v
	}
}