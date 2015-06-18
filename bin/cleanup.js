var mongojs = require("mongojs");
var debug = require("debug")("cleanup");
var async = require("async");
var path = require("path");
var fs = require("fs");
var utils = require("../lib/utils.js");

/*

 cleanup entities & relations in mongo db

 -duplicate data fields
 -empty data fields
 -known importer errors

 */

// load config
var config = require(path.resolve(__dirname, "../config.js"));

// load mongojs
var db = mongojs(config.db, ["entities", "relations", "dataindex"]);

// local modules
var api = require(path.resolve(__dirname, "../lib/api.js"))(config.api, db);

var list = [];

var emptyOrNull = function (s) {
	return s == null || (s.length == 0);
};

var titles = [];

var checkFieldsByFormat = function (data, remove_list, change_list) {
	data.forEach(function (d) {
		if (d.format == 'string') {
			if (emptyOrNull(d.value)) {
				remove_list.push(d);
			} else {
				if (d.desc == 'Beschreibungstext') {
					change_list.push(clone(d));
					d.desc = 'Beschreibung';
				}
			}
		} else if (d.format == 'link') {
			if (!d.value || emptyOrNull(d.value.url)) {
				remove_list.push(d);
			} else {
				if (d.key == 'www' || d.key == 'link') {
					change_list.push(clone(d));
					d.key = 'url';
				}
				if (d.desc == 'URL' || d.desc == 'Link') {
					change_list.push(clone(d));
					d.desc = 'Webseite';
				}
				if (d.value && d.value.desc == 'Fraktion undefined') {
					change_list.push(clone(d));
					d.value.remark = 'Fraktion';
				}
			}
		} else if (d.format == 'range') {
			if ((!d.value) || (
					emptyOrNull(d.value.start) &&
					emptyOrNull(d.value.end)
				))
				remove_list.push(d);
		} else if (d.format == 'donation') {
			if ((!d.value) || (
					emptyOrNull(d.value.year) &&
					emptyOrNull(d.value.amount)
				))
				remove_list.push(d);
		} else if (d.format == 'monthyear') {
			if ((!d.value) || (
					emptyOrNull(d.value.year) &&
					emptyOrNull(d.value.month)
				))
				remove_list.push(d);
		} else if (d.format == 'address') {
			if ((!d.value) || (
					emptyOrNull(d.value.country) &&
					emptyOrNull(d.value.postcode) &&
					emptyOrNull(d.value.city) &&
					emptyOrNull(d.value.www) &&
					emptyOrNull(d.value.name) &&
					emptyOrNull(d.value.email) &&
					emptyOrNull(d.value.addr)
				))
				remove_list.push(d);
		} else if (d.format == 'activity') {
			if ((!d.value) || (
					emptyOrNull(d.value.type) &&
					emptyOrNull(d.value.year) &&
					emptyOrNull(d.value.begin) &&
					emptyOrNull(d.value.end) &&
					emptyOrNull(d.value.periodical) &&
					emptyOrNull(d.value.position) &&
					emptyOrNull(d.value.place) &&
					emptyOrNull(d.value.activity)
				))
				remove_list.push(d);
		} else if (d.format == 'photo') {
			if (d.value.addr || d.value.email) {
				change_list.push(clone(d));
				d.format = 'address';
				d.desc = 'Adresse';
				d.key = 'address';
			} else if (
				emptyOrNull(d.value.url) &&
				emptyOrNull(d.value.copyright)
			)
				remove_list.push(d);
		} else if (d.format == 'number') {
			if (d.value === null) remove_list.push(d);
		} else if (d.format == 'url') {
			if (d.value === null) remove_list.push(d);
		} else if (d.format == 'date') {
			if (d.value === null) remove_list.push(d);
		} else if (d.format == 'integer') {
			if (d.value === null) remove_list.push(d);
			else {
				change_list.push(clone(d));
				d.format = 'number';
			}
		} else if (d.format == 'bool') {
		} else {
			console.log('TODO cleanup format validate:', d.format, d.value);
		}
	});
};

var combineStartEndFields = function (data, remove_list, change_list) {
	var starts = [];
	var ends = [];
	for (var i = 0; i < data.length; i++) {
		var d = data[i];
		if (d.key == 'start' || (d.key == 'begin')) starts.push(d);
		else if (d.key == 'end') ends.push(d);
	}
	if (starts.length == 1 && ends.length == 1) {
		var d = starts[0];
		change_list.push(clone(d));
		d.key = 'range';
		d.format = 'range';
		d.desc = 'Zeitraum';
		d.value = {
			start: d.value.date ? d.value.date : d.value,
			end: ends[0].value.date ? ends[0].value.date : ends[0].value,
			fmt: d.fmt ? d.fmt : 'dd.MM.yyyy'
		};
		remove_list.push(ends[0]);
	}
	else if (starts.length > 0 || ends.length > 0) {
		starts.forEach(function (d) {
			change_list.push(clone(d));
			d.key = 'range';
			d.format = 'range';
			d.desc = 'Zeitraum';
			d.value = {
				start: d.value.date ? d.value.date : d.value,
				end: null,
				fmt: d.fmt ? d.fmt : 'dd.MM.yyyy'
			};
		});
		ends.forEach(function (d) {
			var st = starts.filter(function (sd) {
				return (sd.value.start < d.value);
			});
			if (st.length == 1) {
				st[0].value.end = d.value.date ? d.value.date : d.value;
				remove_list.push(d);
			} else {
				change_list.push(clone(d));
				d.key = 'range';
				d.format = 'range';
				d.desc = 'Zeitraum';
				d.value = {
					start: null,
					end: d.value.date ? d.value.date : d.value,
					fmt: d.fmt ? d.fmt : 'dd.MM.yyyy'
				};
			}
		});
	}
};

var filterDupFields = function (data, remove_list) {
	for (var i = 0; i < data.length; i++) {
		var d = data[i];
		for (var j = i + 1; j < data.length; j++) {
			var d2 = data[j];
			if (utils.fields_equal(d, d2)) {
				d2.removal = 'Duplicate';
				remove_list.push(d2);
			}
		}
	}
};

var fixTitles = function (field, change_list) {
	//return;
	var d = field;
	if (['titles', 'title'].indexOf(d.key) < 0) return;

	var fixs = d.value.replace(/(S|s)?tändige/g, 'ständige');
	if (fixs == d.value) fixs = d.value.replace(/(S|s)?tellvertretend/g, 'stellvertretend');
	if (fixs == d.value) fixs = d.value.replace(/stellv\./g, 'stellvertretend');
	if (fixs == d.value) fixs = d.value.replace(/stell\./g, 'stellvertretend');
	if (fixs == d.value) fixs = d.value.replace(/Vors\. der Komm\./g, 'Vorsitz der Kommission');
	if (fixs == d.value) fixs = d.value.replace(/Vors\. der/g, 'Vorsitz der');
	if (fixs == d.value) fixs = d.value.replace(/gleichzeitig/g, '');
	if (fixs == d.value) fixs = d.value.replace(/zugleich/g, '');
	if (fixs == d.value) fixs = d.value.replace(/  /g, ' ');

	if (fixs !== d.value) {
		change_list.push(clone(d));
		d.value = fixs;
	}

	var approved_titles = {
		'Oberstudiendirektor': true,
		'Oberstudiendirektor a.D.': true,
		'Oberstudiendirektorin': true,
		'Studiendirektor': true,
		'Studiendirektor a.D.': true,
		'Studiendirektorin': true,
		'Studiendirektorin i.K.': true,
		'Studienrat': true,
		'Studienrätin': true,
		'Tierarzt': true,
		'Tierärztin': true,
		'Zahnarzt': true,
		'Zahnärztin': true,
		'Studentensprecher': true,
		'Beiratsmitglied': true,
		'Beisitzerin': true,
		'Kassenleitung': true,
		'Schriftführer': true,
		'Schriftführerin': true,
		'Bundesinnungsmeister': true,
		'Bundesgeschäftsführein': true,
		'Ehrenvorsitzende': true,
		'Stiftungsratsvorsitzender': true,
		'Wirtschaftsberater': true,
		'Volljuristin': true,
		'Verwaltungsratsmitglied': true,
		'Verbandsjustiziar': true,
		'Verbandsjustiziarin': true,
		'Vertretung des Vorstandes': true,

		'Dipl. Ing.': true,
		'Ing.': true,

		'Senator h.c.': true,

		'Dipl. Biologe': true,
		'Dipl. Kfm.': true,
		'Arzt': true,
		'Ärztin': true,
		'Syndikus': true,
		'Fachberater': true,
		'Revisor': true,
		'Revisorin': true,
		'Direktor': true,
		'Direktorin': true,

		'Sprecher': true,
		'Sprecherin': true,
		'Sekretär': true,
		'Sekretärin': true,
		'Protokollführer': true,
		'Protokollführerin': true,
		'Notar': true,
		'Notarin': true,
		'Schriftleiter': true,
		'Schriftleiterin': true,
		'Stiftungsrat': true,
		'Stiftungsratsmitglied': true,
		'Stiftungsratsmitglieder': 'Stiftungsratsmitglied',

		'Bundesgeschäftsführer': true,
		'Bundesgeschäftsführerin': true,
		'Bundesvorstand': true,
		'Bundesvorsitzender': true,
		'Bundesvorsitzende': true,
		'Beiratsvorsitzender': true,
		'Hauptvorstandsvorsitzender': true,
		'Vorsitzender des Vorstandes': true,
		'Bundesvorstandsmitglieder': 'Bundesvorstandsmitglied',
		'Beirat': true,
		'Bundesleitung': true,
		'Schirmherr': true,
		'Schirmherrin': true,
		'Präsident': true,
		'Präsidentin': true,
		'Geschäftsführer': true,
		'Geschäftsführerin': true,
		'Hauptgeschäftsführer': true,
		'Hauptgeschäftsführerin': true,
		'Prokurist': true,
		'Prokuristin': true,
		'Gesellschafter': true,
		'Gesellschafterin': true,
		'Geschäftsstellenleiter': true,
		'Geschäftsstellenleiterin': true,
		'Geschäftsleitung': true,
		'Geschäftsführung': true,
		'Hauptgeschäftsführung': true,
		'Leiter': true,
		'Leiterin': true,
		'Kaufmann': true,
		'Kauffrau': true,
		'Kassierer': true,
		'Kassiererin': true,
		'Kassenwart': true,
		'Kassenwartin': true,
		'Kassenverwalter': true,
		'Kassenverwalterin': true,
		'Kassenprüfer': true,
		'Kassenprüferin': true,
		'Kassenführer': true,
		'Kassenführerin': true,
		'Steuerprüfer': true,
		'Steuerprüferin': true,
		'Buchprüfer': true,
		'Buchprüferin': true,
		'Wirtschaftsprüfer': true,
		'Wirtschaftsprüferin': true,
		'Steuerberater': true,
		'Steuerberaterin': true,
		'Schatzmeister': true,
		'Schatzmeisterin': true,
		'Schatzwart': true,
		'Schatzwartin': true,
		'Schatzwärtin': true,
		'Rechnungsführer': true,
		'Rechnungsführerin': true,
		'Rechnungsprüfer': true,
		'Rechnungsprüferin': true,
		'Hauptkassierer': true,
		'Hauptkassiererin': true,
		'Finanzleiter': true,
		'Finanzleiterin': true,
		'Finanzreferent': true,
		'Finanzreferentin': true,
		'Finanzverantwortliche': true,
		'Finanzverwalter': true,
		'Finanzverwalterin': true,
		'Finanzvorsitzende': true,
		'Finanzvorsitzender': true,
		'Finanzvorstand': true,
		'Exekutivdirektor': true,
		'Exekutivdirektorin': true,
		'Exekutivpräsident': true,
		'Exekutivpräsidentin': true,
		'Vostand': 'Vorstand',
		'Verstand': 'Vorstand',
		'Vorsitzender': true,
		'Vorsitzende': true,
		'Vorsitzer': true,
		'Vorstand': true,
		'Vorstandssprecher': true,
		'Vorständin': true,
		'Vorsteher': true,
		'Vorsteherin': true,
		'Vorstandsmitglied': true,
		'Vorstände': 'Vorstandsmitglied',
		'Vorstandsmitglieder': 'Vorstandsmitglied',
		'Vorstandsvorsitzender': true,
		'Vorstandsvorsitzende': true,
		'Vorstandsbeisitzer': true,
		'Vorstandsbeisitzerin': true,
		'Verbandsrat': true,
		'Verbandsrätin': true,
		'Verbandsratsvorsitzender': true,
		'Verbandsratsvorsitzende': true,
		'Verbandsmitglied': true,
		'Verbandsmitglieder': 'Verbandsmitglied',
		'Verbandspräsident': true,
		'Verbandspräsidentin': true,
		'Verbandsdirektor': true,
		'Verbandsdirektorin': true,
		'Verbandsgeschäftsführer': true,
		'Verbandsgeschäftsführerin': true,

		'Rechtsanwalt': true,
		'Rechtsanwältin': true,
		'RA': 'Rechtsanwalt',
		'RAin': 'Rechtsanwältin',
		'RA in': 'Rechtsanwältin',
		'Jurist': true,
		'Juristin': true,
		'Justitiar': true,
		'Justiziar': true,
		'Justiziarin': true,

		'Realschulrektor': true,
		'Realschulrektorin': true,
		'Ringwart': true,
		'Obmann': true,
		'Obermeister': true,
		'Netzwerkrat': true,
		'Gerüstbaumeister': true,
		'Zahntechnikermeister': true,
		'Zuchtwart': true,
		'Wildmeister': true,
		'Beisitzer': true,
		'Trockenbaumeister': true,
		'Stuckateurmeister': true,
		'Straßenbaumeister': true,

		'Redakteur': true,
		'Redakteurin': true,

		'Hauptmann': true,
		'Hauptmann a.D.': true,
		'Major': true,
		'Major d.R.': true,
		'Oberst': true,
		'Oberst a.D.': true,
		'Stabshauptmann': true,
		'Stabshauptmann a.D': 'Stabshauptmann a.D.',
		'Stabshauptmann a.D.': true,
		'Stabsfeldwebel': true,
		'Stabsfeldwebel a.D.': true,
		'Oberstleutnant a.D.': true,
		'Oberstleutnant i.G.': true,
		'Oberstleutnant': true,
		'Oberstabsbootsmann': true,
		'Oberstabsfeldwebel': true,
		'Oberstabsfeldwebel a.D.': true,
		'Oberstabsfeldwebel d.R.': true,
		'Oberstabsfeldwebel d.Res': 'Oberstabsfeldwebel d.R.',
		'Oberfeldarzt': true,
		'Hauptfeldwebel': true,
		'Kapitän': true,
		'Kapitänleutnant': true,
		'General': true,
		'General a.D.': true,
		'Fregattenkapitän': true,
		'Fregattenkapitän a.D': true,
		'Revieroberjägerin': true,

		'Staatsoberhaupt a.D.': true,
		'Staatsob. a.D.': 'Staatsoberhaupt a.D.',
		'Minister': true,
		'Minister a.D': 'Minister a.D.',
		'Minister a.D.': true,
		'MdB': true,
		'MdEP': true,
		'MdHB': true,
		'MdL': true,
		'MdB a.D.': true,
		'MdB a. D.': 'MdB a.D.',
		'Staatsminister a.D.': true,
		'Staatsminister a. D.': 'Staatsminister a.D.',
		'Staatsministerin a.D.': true,
		'Staatsministerin a.D': 'Staatsministerin a.D.',
		'Senator a.D.': true,
		'Senatorin a.D.': true,
		'Senator E.h.': true,
		'Oberstaatsanwalt': true,
		'Oberamtsanwalt': true,
		'Oberamtsanwältin': true,
		'Oberbürgermeister': true,
		'Konsul': true,
		'Konsul.': true,
		'Konsul a.D.': true,
		'Honorarkonsul': true,
		'Honorargeneralkonsul': true,
		'Hochmeister des Bundes': true,
		'Referent': true,
		'Kongresspräsident': true,
		'Kongresspräsidentin': true,
		'Parlamentarischer Staatssekretär': true,
		'Parlamentarischer Staatssekretär a.D.': true,
		'Parl. Staatssekretärin a.D.': 'Parlamentarischer Staatssekretär a.D.',
		'Parlamentspräsident a.D.': true,
		'Ministerialdirektor i.e.R.': true,
		'Ministerialdirektor': true,
		'Ministerialdirektorin': true,
		'Ministerialdirigent a.D.': true,
		'Magistratsrat': true,
		'Magistratsrätin': true,
		'Magistratsrat a.D.': true,
		'Landesrat': true,
		'Landrat': true,
		'Landrätin': true,
		'Generalsekretär': true,
		'Generalsekretärin': true,
		'Gebietsbeiratsvorsitzender': true,
		'Gebietsbeiratsvorsitzende': true,
		'Vizepräsident': true,
		'Vizepräsidentin': true,
		'Vizepräsidenten': 'Vizepräsident',
		'Verwaltungsrat': true,
		'Verwaltungsrätin': true,
		'Verwaltungsratsmitglieder': 'Verwaltungsratsmitglied',
		'Verwaltungsratsvorsitzender': true,
		'Verwaltungsratsvorsitzende': true,
		'Staatssekretär a.D.': true,
		'Präsidiumsmitglied': true,

		'Monsignore': true,
		'Pfarrer': true,
		'Pfarrerin': true,
		'Pater': true,
		'Geistlicher Berater': true,
		'Geistlicher Beirat': true,
		'geistlicher Beirat': 'Geistlicher Beirat',


		'Sir': true,
		'Graf': true,
		'Fürst': true,
		'Freiherr': true

	};

	var getAcademia = function (val) {
		var sl = val.toLowerCase().split(/\.| |,|-/g).filter(function (s) {
			return s.length > 0;
		});

		var gen = {
			univ: false,
			prof: false,
			dr: 0,
			hc: false,
			eh: false,
			rer: false,
			area: [],
			habil: false,
			mult: false,
			ing: false,
			ma: false,
			msc: false,
			sc: false
		};

		for (var i = 0; i < sl.length; i++) {
			var ls = sl[i];
			if ((ls == 'universitäts-prof') || (ls == 'universitätsprof') ||
				((ls == 'univ' || ls == 'universitäts') && (sl.indexOf('prof') >= 0))) gen.univ = true;
			if (ls == 'prof' || ls == 'prod' || ls == 'professor' || ls == 'professorin') gen.prof = true;
			else if (ls == 'ing' || ls == 'ingenieur' || ls == 'ingenieurin') gen.ing = true;
			else if (ls == 'dr') gen.dr += 1;
			else if (ls == 'drdr') gen.dr += 2;
			else if (ls == 'eh' || (ls == 'e' && (sl.indexOf('h') >= 0))) gen.eh = true;
			else if (ls == 'hc' || (ls == 'c' && (sl.indexOf('h') >= 0))) gen.hc = true;
			else if (ls == 'ma' || ls == 'master' || ls == 'arts' || (ls == 'm' && (sl.indexOf('a') >= 0))) gen.ma = true;
			else if (ls == 'ph' || ls == 'phd') gen.phd = true;
			else if (ls == 'msc' || (ls == 'sc' && (sl.indexOf('m') >= 0))) gen.msc = true;
			else if (ls == 'sc' && (sl.indexOf('dr') >= 0)) gen.sc = true;
			else if (ls == 'rer') gen.rer = true;
			else if (ls == 'habil') gen.habil = true;
			else if (ls == 'mult') gen.mult = true;
			else if (['med', 'pol', 'agr', 'vet', 'dent', 'oec', 'soc', 'hum', 'bio', 'iur', 'phil', 'math', 'jur', 'nat'].indexOf(ls) >= 0) gen.area.push(ls);
			else if (ls == 'a' || ls == 'of' || ls == 'h' || ls == 'm' || ls == 'd') {
			}
			else {
				return false;
			}
		}

		var result = [];
		if (gen.univ) result.push('Univ.-Prof.');
		else if (gen.prof) result.push('Prof.');
		for (var i = 0; i < gen.dr; i++) {
			result.push('Dr.')
		}
		if (gen.rer) result.push('rer.');
		if (gen.ing) result.push('Ing.');
		if (gen.ma) result.push('M.A.');
		if (gen.msc) result.push('M.sc.');
		if (gen.sc) result.push('sc.');
		if (gen.area.length) result.push(gen.area.join('.') + '.');
		if (gen.hc) result.push('h.c.');
		if (gen.mult) result.push('mult.');
		if (gen.eh) result.push('E.h.');
		if (gen.habil) result.push('habil.');
		return result.join(' ');
	};

	var find = function (val) {
		var title = getAcademia(val);
		if (title) return title;
		title = approved_titles[val];
		if (!title) {
			var prefixes = [
				'geschäftsführender', 'geschäftsführendes', 'geschäftsführende',
				'stellvertretender', 'stellvertretendes', 'stellvertretende',
				'1. stellvertretender', '1. stellvertretendes', '1. stellvertretende',
				'2. stellvertretender', '2. stellvertretendes', '2. stellvertretende',
				'wissenschaftlicher', 'wissenschaftliche',
				'kommissarischer', 'kommissarische',
				'ehrenamtlicher', 'ehrenamtliche',
				'designierter', 'designierte',
				'kaufmännischer', 'kaufmännische',
				'amtierender', 'amtierende',
				'1.', '2.', '3.', '4.', '.5'
			];
			for (var i = 0; i < prefixes.length - 1; i++) {
				if (val.toLowerCase().indexOf(prefixes[i]) == 0) {
					var test = val.slice(prefixes[i].length).trim();
					title = approved_titles[test];
					if (title) {
						if (typeof title == 'boolean') title = test;
						return prefixes[i] + ' ' + title;
					}
				}
			}
		}
		if (typeof title == 'boolean') title = val;
		return title;
	};

	var greedyTitle = function (sl) {
		for (var i = sl.length - 1; i >= 0; i--) {
			var testsl = sl.slice(0, i + 1);
			var test = testsl.join(' ');
			var title = find(test);
			//console.log('test', test, testsl, title);
			if (title) {
				return {
					title: title,
					length: i + 1
				};
			}
		}
		return false;
	};

	var splitTitle = function (val) {
		var sl = val.split(/ |,|\//g).filter(function (s) {
			return s.length > 0;
		});
		if (sl.length < 2) return [];
		var result = [];
		while (sl.length > 0) {
			var g = greedyTitle(sl);
			if (g) {
				result.push(g.title);
				sl = sl.slice(g.length);
			} else {
				//we could not match min. one, keep hands away
				return [];
			}
		}
		return result;
	};


	var val = d.value;
	var title = find(val);
	if (title) {
		if (title !== val) {
			change_list.push(clone(d));
			d.value = title;
		}
		return;
	}
	var sl = val.split(' , ');
	var splits = [];
	var found = 0;
	sl.forEach(function (s) {
		s = s.trim();
		title = find(s);
		if (title) {
			found++;
			splits.push(title);
		} else {
			var deepsl = splitTitle(s);
			if (deepsl.length == 0) {
				splits.push(s);
				if (titles.indexOf(s) < 0)titles.push(s);
			} else {
				found += deepsl.length;
				splits = splits.concat(deepsl);
			}
		}
	});
	title = splits.join(' , ');
	if (title !== val) {
		change_list.push(clone(d));
		d.value = title;
	}
};


var fixEntities = function (cb) {
	console.log('Fixing Entities');
	api.ents(function (err, ents) {
		if (err) return fn(err);
		async.forEachSeries(ents, function (ent, next) {
			var remove_list = [];
			var change_list = [];

			ent.data.forEach(function (d) {
				fixTitles(d, change_list);
			});

			checkFieldsByFormat(ent.data, remove_list, change_list);
			filterDupFields(ent.data, remove_list);
			combineStartEndFields(ent.data, remove_list, change_list);

			if (remove_list.length > 0) {
				ent.data = ent.data.filter(function (d) {
					return remove_list.indexOf(d) < 0;
				});
			}

			if (remove_list.length + change_list.length > 0) {
				api.ent_store(ent, function (err) {
					if (err) console.log(err);
					var info = {
						ent: ent,
						removed: remove_list,
						changed: change_list
					};
					list.push(info);
					next();
				});
			} else {
				setImmediate(next); //nothing to do
			}
		}, function () {
			cb(ents);
		});
	});
};

var fixRelations = function (entities, cb) {
	console.log('Fixing Relations');
	var entity_ids = {};
	entities.forEach(function (ent) {
		entity_ids[ent._id.toString()] = true;
	});
	api.rels_full({full: true}, function (err, rels) {
		if (err) return fn(err);
		async.forEachSeries(rels, function (rel, next) {
			if (rel.entities.length !== 2) {
				console.log('relation with invalid entity count, removing relation');
				return api.rel_delete(rel._id, function (err) {
					list.push({
						removed_rel: rel,
						"invalid": "entity_ids.length"
					});
					if (err) return console.log(err);
					return next();
				});
			}

			if (!entity_ids[rel.entities[0].toString()] || !entity_ids[rel.entities[1].toString()]) {
				console.log('relation with invalid entity ids, removing relation');
				return api.rel_delete(rel._id, function (err) {
					list.push({
						removed_rel: rel,
						"invalid": "entity_ids"
					});
					if (err) return console.log(err);
					return next();
				});
			}

			var remove_list = [];
			var change_list = [];

			checkFieldsByFormat(rel.data, remove_list, change_list);
			filterDupFields(rel.data, remove_list);
			combineStartEndFields(rel.data, remove_list, change_list);

			if (remove_list.length > 0) {
				rel.data = rel.data.filter(function (d) {
					return remove_list.indexOf(d) < 0;
				});
			}

			if (remove_list.length + change_list.length > 0) {
				api.rel_store(rel, function (err) {
					if (err) console.log(err);
					var info = {
						rel: rel,
						removed: remove_list,
						changed: change_list
					};
					list.push(info);
					next();
				});
			} else {
				setImmediate(next); //nothing to do
			}
		}, function () {
			cb();
		});
	});
};

var clone = function (obj) {
	return JSON.parse(JSON.stringify(obj));
};

var fixFields = function (cb) {
	console.log('Fixing Fields');

	var fieldtypes = {};

	var toList = function (obj) {
		return Object.keys(obj).map(function (key) {
			return obj[key];
		}).sort(function (a, b) {
			if (a.mode < b.mode)return -1;
			if (a.mode > b.mode)return 1;
			if (a.format < b.format)return -1;
			if (a.format > b.format)return 1;
			if (a.key < b.key)return -1;
			if (a.key > b.key)return 1;
			if (a.name < b.name)return -1;
			if (a.name > b.name)return 1;
			return 0;
		})
	};

	var logEntityFieldType = function (d, ent) {
		var mode = ent.type == 'person' ? 'persons' : 'organisations';
		var id = [d.key, d.format, d.desc, mode].join('|');
		fieldtypes[id] = {mode: mode, format: d.format, key: d.key, name: d.desc}
	};

	var logRelationFieldType = function (d) {
		var id = [d.key, d.format, d.desc, 'relations'].join('|');
		fieldtypes[id] = {mode: 'relations', format: d.format, key: d.key, name: d.desc}
	};

	api.field_list(null, function (err, fields) {
		api.ents(function (err, ents) {
			ents.forEach(function (ent) {
				ent.data.forEach(function (d) {
					logEntityFieldType(d, ent);
				});
			});
			api.rels_full({full: true}, function (err, rels) {
				rels.forEach(function (rel) {
					rel.data.forEach(logRelationFieldType);
				});
				var fields_in_use = toList(fieldtypes);
				var new_fields = fields_in_use.filter(function (t) {
					//console.log(JSON.stringify(t));
					var flist = fields.filter(function (f) {
						return ((f.key == t.key) && (f.mode == t.mode) && (f.format == t.format) && (f.name == t.name));
					});
					return (flist.length == 0);
				});
				if (!new_fields.length) return cb();
				//console.log(new_fields.length, 'new fields');
				//async.forEachSeries(new_fields, function (t, next) {
				//		console.log('create field', JSON.stringify(t));
				//		api.field_create(t, next);
				//	}, cb
				//);
				cb();
			});
		});
	});
};

fixEntities(function (entities) {
	fixRelations(entities, function () {
		if (list.length > 0) {
			console.log(list.length, 'changes');
			var filename = './cleanup-log-' + (new Date()).valueOf() + '.json';
			fs.writeFileSync(path.resolve(__dirname, filename), JSON.stringify(list, null, '\t'));
		}
		titles.sort(function (a, b) {
			if (a < b)return -1;
			if (a > b)return 1;
			return 0;
		});
		console.log(titles);

		fixFields(function () {
			console.log('done');
			process.exit();
		});
	});
});
