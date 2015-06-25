var db = require("./db.js");
var combine_relations = {};
var remove_relations = [];
var removeMultipleRelations = function (rel, state) {
	if (remove_relations.indexOf(rel._id.toString()) >= 0) {
		state.removed_rel = 'Merged Relation';
	}
};

var mergeMultipleRelations = function (rel, state) {
	var unique = rel.entities.map(function (id) {
		return id.toString();
	}).sort(function (a, b) {
		if (a < b) return -1;
		if (a > b) return 1;
		return 0;
	}).join(' - ');
	if (combine_relations[unique]) {
		var copy_rel = combine_relations[unique];
		remove_relations.push(copy_rel._id.toString());
		if (copy_rel.tags) {
			rel.tags = rel.tags || [];
			copy_rel.tags.forEach(function (tag) {
				if (rel.tags.indexOf(tag) < 0) {
					state.changed_rel = 'Tags change';
					rel.tags.push(tag);
				}
			});
		}
		rel.data = rel.data || [];
		copy_rel.data.forEach(function (d) {
			rel.data.push(d);
			state.changed('merge relation data', d);
		})
	}
	combine_relations[unique] = rel;
};

db.run('Merge Multiple Relations', [], [mergeMultipleRelations], function () {
	db.run('Remove Multiple Relations', [], [removeMultipleRelations]);
});
