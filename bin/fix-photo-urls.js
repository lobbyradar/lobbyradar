var db = require("./db.js");

//these urls are available as https
var httpsies = [
	'http://www.bundestag.de',
	'http://medien.linksfraktion.de',
	'http://upload.wikimedia.org',
	'http://www.gruene-bundestag.de'
];

var no_httpsies = [
	'http://www.abgeordnetenwatch.de',
	'http://www.spdfraktion.de'
];

var fixPhotos = function (ent, state) {
	ent.data.forEach(function (d) {
		if ((d.key == 'photo') && (d.value.url.indexOf('http:') == 0)) {
			var found = false;
			httpsies.forEach(function (h) {
				if (found)return;
				if (d.value.url.indexOf(h) == 0) {
					state.changed('http->https', d);
					d.value.url = d.value.url.replace('http://', 'https://');
					found = true;
				}
			});
			no_httpsies.forEach(function (h) {
				if (found)return;
				if (d.value.url.indexOf(h) == 0) {
					found = true;
				}
			});
			if (!found)
				console.log(d.value.url);

		}
	})
};

db.run('Fix http->https photo urls', [fixPhotos], []);
