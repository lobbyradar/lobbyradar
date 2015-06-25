var db = require("./db.js");

/* unify fields options && fix text fields */

var unifyTexts = function (data, state) {
	data.forEach(function (d) {
		if (d.format == 'string') {
			if (d.desc == 'Beschreibungstext') {
				state.change_data.push({reason: 'unify texts', data: clone(d)});
				d.desc = 'Beschreibung';
			}
		} else if (d.format == 'link') {
			if (d.key == 'www' || d.key == 'url') {
				state.change_data.push({reason: 'unify link key', data: clone(d)});
				d.key = 'link';
			}
			if (d.desc == 'URL' || d.desc == 'Link') {
				state.change_data.push({reason: 'unify texts', data: clone(d)});
				d.desc = 'Webseite';
			}
		} else if (d.format == 'integer') {
			state.change_data.push({reason: 'unify number format key', data: clone(d)});
			d.format = 'number';
		}
		if (d.value && d.value.desc == 'Fraktion undefined') {
			state.change_data.push({reason: 'fix text', data: clone(d)});
			d.value.desc = 'Fraktion';
		}
	});
};


var unifyTextsEntity = function (ent, state) {
	unifyTexts(ent.data, state);
};

var unifyTextsRel = function (rel, state) {
	unifyTexts(rel.data, state);
};

db.run('Unify Texts', [unifyTextsEntity], [unifyTextsRel]);
