var db = require("./db.js");

var entity_ids = {};

var checkRelation = function (rel, state) {
	if (rel.entities.length !== 2) {
		//console.log('relation with invalid entity count ' + rel.entities.length + ', removing relation');
		state.removed_rel = 'relation with invalid entity count ' + rel.entities.length;
		return;
	}
	if (rel.entities[0].toString() == rel.entities[1].toString()) {
		//console.log('relation with itself, removing relation');
		state.removed_rel = 'relation with itself';
	}
	if (!entity_ids[rel.entities[0].toString()] || !entity_ids[rel.entities[1].toString()]) {
		//console.log('relation with invalid entity ids, removing relation');
		state.removed_rel = 'relation with invalid entity ids';
	}
};

var collectIds = function (ent, state) {
	entity_ids[ent._id.toString()] = true;
};

db.run('Fix Invalid Relation', [collectIds], [checkRelation]);
