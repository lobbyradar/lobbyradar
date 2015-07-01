var EntityDisplay = {};

// tools

EntityDisplay.isExistant = function (el) {
	return !( (el == undefined) || (el == null) || (el === '') );
};

EntityDisplay.numberWithCommas = function (x) {
	var s = x.toString();
	s = s.split('.');
	if (s[1] == undefined) s[1] = '00';
	if (s[1].length == 1 && s[1] != undefined) s[1] += '0';
	if (s[1].length > 2) s[1] = s[1].slice(0, 2);
	var pre = EntityDisplay.numberThousandSep(s[0]);
	return pre + ',' + s[1];
};

EntityDisplay.numberThousandSep = function (x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// entity display

EntityDisplay.displayEntityTabs = function (entity, tabs) {
	tabs = tabs.filter(function (tab) {
		return tab.content.length > 0;
	});
	if (tabs.length == 0) return '';
	if (tabs.length == 1) return tabs[0].content;

	var result = '<ul class="nav nav-tabs nav-tabs-relation" role="tablist">';
	tabs.forEach(function (tab, i) {
		result += '<li role="presentation" class="' + (i == 0 ? 'active' : '') + '"><a href="#' + tab.id + '" aria-controls="' + tab.id + '" role="tab" data-toggle="tab">' + tab.name + '</a></li>';
	});
	result += '</ul>';


	result += '<div class="tab-content">';
	tabs.forEach(function (tab, i) {
		result += '<div role="tabpanel" class="tab-pane' + (i == 0 ? ' active' : '') + '" id="' + tab.id + '">' + tab.content + '</div>';
	});
	result += '</div>';
	return result;
};

EntityDisplay.displayEntity = function (entity) {
	var result = '<div class="entity">';
	if (!entity)  return result + '</div';

	result += EntityDisplay.displayHeaderEntity(entity);

	result += EntityDisplay.displayEntityRelations(entity);

	result += EntityDisplay.displayReportEntity(entity);

	result += EntityDisplay.displayFooterEntity(entity);

	result += '</div>';

	return result;
};

EntityDisplay.displayEntityRelations = function (entity) {
	if (entity.relations.length == 0) return '';

	var result = '';

	var collect = {
		governments: {id: 'governments', name: 'Politische Positionen', list: [], format: EntityDisplay.displayGeneric},
		memberships: {id: 'memberships', name: 'Mitgliedschaften', list: [], format: EntityDisplay.displayGeneric},
		otherjobs: {id: 'otherjobs', name: 'Beschäftigungen', list: [], format: EntityDisplay.displayGeneric},
		hausausweise: {id: 'hausausweise', name: 'Hausausweise', list: [], format: EntityDisplay.displayGeneric},
		activities: {id: 'activities', name: 'Arbeitgeberschaft', list: [], format: EntityDisplay.displayGeneric},
		otherassociations: {id: 'otherassociations', name: 'Verbindungen', list: [], format: EntityDisplay.displayGeneric},
		everythingelse: {id: 'everythingelse', name: 'Verbindungen', list: [], format: EntityDisplay.displayGeneric},
		nebentaetigkeiten: {id: 'nebentaetigkeiten', name: 'Nebeneinkünfte', list: [], format: EntityDisplay.displayAddIncomes},
		donations: {id: 'donations', name: 'Parteispenden', list: [], format: EntityDisplay.displayDonations},
		committees: {id: 'committees', name: 'Ausschüsse', list: [], format: EntityDisplay.displayCommittees},
		links: {id: 'links', name: 'Links', list: [], format: EntityDisplay.displayEntityLinks},
		source: {id: 'source', name: 'Quellen', list: [], format: EntityDisplay.displayEntitySources}
	};

	entity.relations.forEach(function (rel) {

		// failsafe check if relation has entity and id
		if (!(rel.hasOwnProperty("entity"))) return;// console.log("no entity", rel);
		if (rel.entity.hasOwnProperty("_id") && !(rel.entity.hasOwnProperty("id"))) rel.entity.id = rel.entity._id;
		if (!(rel.entity.hasOwnProperty("id")) || !rel.entity.id) return;// console.log("no id", rel)

		var activities = []; //nebeneinkünfte
		var associations = []; // verbindungen (goverment, anstellungen, exeutive, memberships, hausausweise, geschäftsverbindungen ...)
		var donations = []; // parteispenden
		var everythingelse = []; //alles andere

		if (rel.data && rel.data.length > 0) {
			rel.data.forEach(function (d) {
				if (d.format == 'activity') activities.push(d);
				else if (d.format == 'association') associations.push(d);
				else if (d.format == 'donation') donations.push(d);
				else everythingelse.push(d);
			});
		}

		if ((activities.length > 0) && EntityDisplay.isExistant(rel.entity)) {
			if (rel.tags.indexOf("nebentaetigkeit") >= 0) {
				// is nebentaetigkeit
				switch (entity.type) {
					case "person":
						collect.nebentaetigkeiten.list.push({rel: rel, list: activities});
						break;
					default:
						collect.activities.list.push({rel: rel, list: activities, format: EntityDisplay.formatActivity, icon: 'fa-group'});
						break;
				}
			} else {
				// is not nebentaetigkeit
				collect.activities.list.push({rel: rel, list: activities, format: EntityDisplay.formatActivity, icon: 'fa-suitcase'});
			}
		}

		if (donations.length > 0) {
			collect.donations.list.push({rel: rel, list: donations});
		}

		var governments = associations.filter(function (d) {
			return d.value && (d.value.type == 'government')
		});
		if (governments.length > 0) {
			collect.governments.list.push({rel: rel, list: governments, format: EntityDisplay.formatAssociation, icon: 'fa-institution'});
		}

		var memberships = associations.filter(function (d) {
			return d.value && (d.value.type == 'member')
		});
		if (memberships.length > 0) {
			collect.memberships.list.push({
				rel: rel, list: memberships, format: function (data) {
					return EntityDisplay.formatAssociation(data, 'Mitglied');
				}, icon: 'fa-group'
			});
		}

		var otherjobs = associations.filter(function (d) {
			return d.value && (d.value.type == 'job');
		});
		if (otherjobs.length > 0) {
			collect.otherjobs.list.push({rel: rel, list: otherjobs, format: EntityDisplay.formatAssociation, icon: 'fa-group'});
		}

		var hausausweise = associations.filter(function (d) {
			return d.value && (d.value.type == 'pass') && (d.value.position == 'Hausausweise');
		});
		if (hausausweise.length > 0) {
			collect.hausausweise.list.push({rel: rel, list: hausausweise, format: EntityDisplay.formatHausausweis, icon: 'fa-key', prefix: 'Hausausweis für: '});
		}

		var committees = associations.filter(function (d) {
			return d.value && (d.type == 'committee');
		});
		if ((rel.tags.indexOf('committee') >= 0) || committees.length > 0) {
			collect.committees.list.push({rel: rel, list: committees});
		}

		var businesses = associations.filter(function (d) {
			return d.value && (d.value.type == 'business');
		});
		if (businesses.length > 0) {
			collect.otherassociations.list.push({rel: rel, list: otherjobs, format: EntityDisplay.formatAssociation, icon: 'fa-money'});
		}

		var otherassociations = associations.filter(function (d) {
			return d.value
				&& (governments.indexOf(d) < 0)
				&& (memberships.indexOf(d) < 0)
				&& (otherjobs.indexOf(d) < 0)
				&& (businesses.indexOf(d) < 0)
				&& (committees.indexOf(d) < 0)
				&& (hausausweise.indexOf(d) < 0);
		});
		if (otherassociations.length > 0) {
			collect.otherassociations.list.push({rel: rel, list: otherassociations, format: EntityDisplay.formatAssociation, icon: 'fa-code-fork'});
		}

		if ((everythingelse.length > 0) || (rel.data.length == 0)) {
			collect.everythingelse.list.push({
				rel: rel, list: everythingelse, format: function (data) {
					//TODO: format everything else
					return '';
				}, icon: 'fa-share-alt'
			});
		}
	});

	var tabs = Object.keys(collect).map(function (key) {
		var tab = collect[key];
		tab.content = tab.format(entity, tab);
		return tab;
	});

	result += EntityDisplay.displayEntityTabs(entity, tabs);

	return result;
};

EntityDisplay.displayGeneric = function (entity, tab) {
	var result = '';
	var list = tab.list.sort(function (a, b) {
		if (a.rel.entity.name < b.rel.entity.name) return -1;
		if (a.rel.entity.name > b.rel.entity.name) return 1;
		return 0;
	});
	list.forEach(function (r) {
		result += EntityDisplay.formatRelation(r.rel, r.list, r.format, r.icon, r.prefix);
	});
	if (result.length > 0) {
		result = '<div class="row-results-title">' + tab.name + ': ' + (tab.list.length > 1 ? tab.list.length : '') + '</div>' +
			'<div class="entity-relations-list">' + result + '</div>';
	}
	return result;
};

EntityDisplay.displayHeaderEntity = function (entity) {

	var result = '<div class="row row-results">';

	var photos = entity.data.filter(function (d) {
		return (d.format == 'photo' && d.key == 'photo' && d.desc == 'Foto' && EntityDisplay.isExistant(d.value.url));
	});
	if (photos.length > 0) {
		result += '<div class="col-md-3"><div class="entity-img" style="background-image:url(' + photos[0].value.url + ')" /></div>';
	}
	result += '<div class="col-md-' + (photos.length > 0 ? '9' : '12') + '">' +
		'<h1 class="name">';
	if (entity.type == 'person') {
		result += '<i class="fa fa-user"></i>&nbsp;'; // PERSON
	}
	var icon = '';
	var verified = false;
	entity.data.forEach(function (d) {
		if (entity.type == 'entity' && d.key == 'partei') {
			icon = '<i class="fa fa-pie-chart"></i>&nbsp;'; // PARTEI
		} else if (entity.type == 'entity' && d.key == 'legalform') {
			icon = '<i class="fa fa-building-o"></i>&nbsp;'; // PARTEI
		}
		if ((d.key == 'verified') && (d.value)) verified = true;
	});
	result += icon + entity.name + '&nbsp;';
	if (verified) {
		result += '<i title="Redaktionell geprüft" id="certified" class="fa fa-check-square-o"></i>';
	}
	result += '</h1>';

	entity.tags.forEach(function (tag) {
		if (tag == 'mdb') {
			result += '<p>Mitglied des Bundestages</p>';
		} else if (tag == 'lobbyist') {
			result += '<p>LobbyistIn / InteressensvertreterIn</p>'
		} else if (tag == 'anwaltskanzlei') {
			result += '<p>Anwaltskanzlei</p>'
		} else if (tag == 'committee') {
			result += '<p>Ausschuss des Bundestags</p>'
		} else if (tag == 'lobbyorganisation') {
			result += '<p>Lobbyismus-Organisation registriert beim Deutschen Bundestag</p>'
		} else if (tag == 'thinktank') {
			result += '<p>Think Tank</p>'
		} else if (tag == 'dax' && entity.type == 'entity') {
			result += '<p>Dax-Konzern</p>'
		} else if (tag == 'pr-und-lobbyagentur') {
			result += '<p>Lobbyismus-Agentur</p>'
		}
	});
	result += '</div>';

	result += '</div>';
	return result;
};

EntityDisplay.displayFooterEntity = function (entity) {
	var result = '<div class="row"><br/>' +
		'<div class="col-sm-12">' +
		'<p class="meta">' +
		'<span>Stand der Daten: ' + moment(entity.created).format("DD.MM.YYYY hh:mm") + '</span>' +
		'</p>' +
		'</div></div>';
	return result;
};

EntityDisplay.displayReportEntity = function (entity) {
	var result =
		'<div class="row"><br/>' +
		'<div class="col-sm-6">' +
		'<a class="btn btn-block btn-default" href="mailto:lobbyradar@zdf.de?subject=Verbindung melden ' + entity.name +
		' (' + entity._id + ')&body=Ich möchte eine Verbindung melden:" role="button">Verbindung melden</a>' +
		'</div>' +
		'<div class="col-sm-6">' + '<a class="btn btn-block btn-default" href="mailto:lobbyradar@zdf.de?subject=Fehler melden ' +
		entity.name + ' (' + entity._id + ')&body=Ich möchte einen Fehler melden:" role="button">Fehler melden</a>' +
		'</div></div>';
	return result;
};

EntityDisplay.displayEntitySources = function (entity) {
	var result = '';
	entity.data.forEach(function (d) {
		if ((d.desc == 'Quelle') && (d.value.url)) {
			result += '<div class="entity-source"><i class="fa fa-bookmark"></i> <a title="' + d.value.url + '" target="_blank" href="' + d.value.url + '">' + d.value.url + '</a></div>';
		}
	});
	if (result.length > 0) {
		result = '<div class="row-results-title">Quellen</div>' + result;
	}
	return result;
};

EntityDisplay.displayEntityLinks = function (entity) {
	var result = '';
	entity.data.forEach(function (d) {
		if (d.key == 'link') {
			result +=
				'<div class="entity-link"><i class="fa fa-external-link"></i> <a title="' + d.value.url + '" target="_blank" href="' + d.value.url + '">' + d.value.url + '</a></div>';
		}
	});
	if (result.length > 0) {
		//console.log('Entity has Links');
		result = '<div class="row-results-title">Links</div>' + result;
	}
	return result;
};

EntityDisplay.displayDonations = function (entity, donations) {
	var result = '';
	donations.list.forEach(function (r) {
		result += EntityDisplay.formatEntityLink(r.rel.entity) + '<br/>';
		r.list.sort(function (a, b) {
			return b.value.year - a.value.year;
		});
		result += '<table class="table-condensed table-bordered table">';
		r.list.forEach(function (data) {
			result += '<tr><td>' + data.value.year + ' </td>' +
				'<td>' + EntityDisplay.numberWithCommas(data.value.amount) + ' € </td></tr>';
		});
		result += '</table>';
	});
	if (result.length > 0) {
		var parteiString = 'Parteispende';
		if (entity.type == 'person') {
			parteiString += ' an ';
		} else if (entity.type == 'entity') {
			parteiString += (entity.tags.indexOf('partei') >= 0) ? ' von ' : ' an ';
		}
		result = '<div class="row-results-title"><i class="fa fa-euro"></i>&nbsp;' + parteiString + '</div>' +
			'<div class="entity-relations-item">' + result + '</div>';
	}
	return result;
};

EntityDisplay.displayAddIncomes = function (entity, nebentaetigkeiten) {
	var result = '';
	//nebeneinkünfte sortiert nach beschreibung
	var nebeneinkunft_collect = {};
	nebentaetigkeiten.list.forEach(function (r) {
		r.list.forEach(function (d) {
			var desc = d.value.desc || 'Nebentätigkeit';
			nebeneinkunft_collect[desc] = nebeneinkunft_collect[desc] || [];
			nebeneinkunft_collect[desc].push({rel: r.rel, d: d});
		});
	});
	Object.keys(nebeneinkunft_collect).forEach(function (key) {
		if (result.length) result += '<br />';
		result += '<h5>' + key + '</h5>';
		nebeneinkunft_collect[key].sort(function (a, b) {
			var year_a = 0;
			if (a.d.value && a.d.value.start && a.d.value.start.year) year_a = a.d.value.start.year;
			var year_b = 0;
			if (b.d.value && b.d.value.start && b.d.value.start.year) year_b = b.d.value.start.year;
			if (year_a < year_b) return 1;
			if (year_a > year_b) return -1;
			if (a.rel.entity.name < b.rel.entity.name) return -1;
			if (a.rel.entity.name > b.rel.entity.name) return 1;
			var level_a = 0;
			if (a.d.value && a.d.value.level) level_a = a.d.value.level;
			var level_b = 0;
			if (b.d.value && b.d.value.level) level_b = b.d.value.level;
			if (level_a < level_b) return 1;
			if (level_a > level_b) return -1;
			return 0;
		}).forEach(function (r) {
			result += EntityDisplay.formatEntityLink(r.rel.entity);
			var s = EntityDisplay.formatNebeneinkunft(r.d);
			if (s.length > 0) result += '<br/>' + s;
			result += '<br/>';
		});
	});
	if (result.length > 0) {
		result = '<div class="row-results-title"><i class="fa fa-suitcase"></i>&nbsp;Tätigkeit neben dem Bundestagsmandat</div>' +
			'<div class="entity-relations-item">' + result + '</div>';
	}
	return result;
};

EntityDisplay.displayCommittees = function (entity, committees) {
	var result = '';
	committees.list.forEach(function (r) {
		result += EntityDisplay.formatEntityLink(r.rel.entity) + '<br/>';
	});
	if (result.length > 0) {
		result = '<div class="row-results-title"><i class="fa fa-group"></i>&nbsp;Ausschüsse des Bundestags</div>' +
			'<div class="entity-relations-item">' + result + '</div>';
	}
	return result;
};

//formatters

EntityDisplay.formatRelation = function (rel, datalist, formatter, icon, nameprefix) {
	var result = '<div class="entity-relations-item"><i class="fa ' + icon + '"></i>&nbsp;' + (nameprefix ? nameprefix : '') + EntityDisplay.formatEntityLink(rel.entity);
	// add activity from data
	datalist.sort(function (a, b) {
		var year_a = 0;
		if (a.value && a.value.start && a.value.start.year) year_a = a.value.start.year;
		var year_b = 0;
		if (b.value && b.value.start && b.value.start.year) year_b = b.value.start.year;
		if (year_a < year_b) return 1;
		if (year_a > year_b) return -1;
		return 0;
	}).forEach(function (data) {
		result += formatter(data);
	});
	result += '</div>';
	return result;
};

EntityDisplay.formatAssociation = function (data, defaultposition) {
	var result = '';
	if (data.value.sources && data.value.sources.length > 0) result += EntityDisplay.formatSource(data);
	if (data.value.position) result += '<br/>' + data.value.position;
	else if (defaultposition)result += '<br/>' + defaultposition;
	var dateString = EntityDisplay.formatSplitDateRange(data.value.start, data.value.end);
	if (dateString.length > 0) result += '<br/>' + dateString;
	return result;
};

EntityDisplay.formatActivity = function (data) {
	var result = '';
	if (data.value.sources && data.value.sources.length > 0) result += EntityDisplay.formatSource(data);
	if (data.value.position) result += '<br/>' + data.value.position;
	var dateString = EntityDisplay.formatSplitDateRange(data.value.start, data.value.end);
	if (dateString.length > 0) result += '<br/>' + dateString;
	return result;
};

EntityDisplay.formatNebeneinkunft = function (data) {
	var sl = [];
	if (data.value.start != null) {
		sl.push(data.value.start.year);
	} else if (data.value.end != null) {
		sl.push(data.value.end.year);
	}
	if (data.value.position != null) {
		sl.push(data.value.position);
	}
	if (data.value.activity != null) {
		sl.push(data.value.activity);
	}
	if (data.value.level !== 0) {
		if (data.value.periodical != null) {
			sl.push(data.value.periodical);
		}
		sl.push('Stufe: ' + EntityDisplay.formatStagesAddIncome(data.value.level));
	}
	return sl.join(' ');
};

EntityDisplay.formatHausausweis = function (data) {
	var result = '';
	if (data.value.sources && data.value.sources.length > 0) result += EntityDisplay.formatSource(data);
	if (data.value.desc) result += '<br/>Ausgestellt von <em>' + data.value.desc + "</em>";
	var dateString = EntityDisplay.formatSplitDateRange(data.value.start, data.value.end);
	if (dateString.length > 0) result += '<br/>' + dateString;
	return result;
};

EntityDisplay.formatSource = function (data) {
	if (data.value.sources && data.value.sources.length > 0) return '<a class="rel-data-source pull-right" target="_blank" title="' + data.value.sources[0] + '" href="' + data.value.sources[0] + '">Quelle</a>';
	return '';
};

EntityDisplay.formatEntityLink = function (entity) {
	var result = '';
	if (EntityDisplay.isExistant(entity) && EntityDisplay.isExistant(entity._id)) {
		result = '<a class="ajax-load entity-connections" href="/entity/' + entity._id + '">';
		if (EntityDisplay.isExistant(entity.name)) {
			result += entity.name + '&nbsp;';
		}
		result += '</a>';
	}
	return result;
};

EntityDisplay.formatSplitDate = function (date) {
	var result = '';
	if (!date) return result;
	var months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
	if (date.year) {
		if (date.month) {
			if (date.day) {
				result += date.day + '. ';
			}
			result += months[date.month - 1] || '';
		}
		result += ' ' + date.year;
	}
	return result.trim();
};

EntityDisplay.formatSplitDateRange = function (start, end) {
	var result = '';
	var seit = EntityDisplay.formatSplitDate(start);
	var bis = EntityDisplay.formatSplitDate(end);
	if (seit.length > 0) result += 'seit ' + seit;
	if (bis.length > 0) result += ' bis ' + bis;
	return result;
};

EntityDisplay.formatStagesAddIncome = function (val) {
	switch (val) {
		case 1:
			return " 1 (über 1.000€)";
			break;
		case 2:
			return " 2 (über 3.500€)";
			break;
		case 3:
			return " 3 (über 7.000€)";
			break;
		case 4:
			return " 4 (über 15.000€)";
			break;
		case 5:
			return " 5 (über 30.000€)";
			break;
		case 6:
			return " 6 (über 50.000€)";
			break;
		case 7:
			return " 7 (über 75.000€)";
			break;
		case 8:
			return " 8 (über 100.000€)";
			break;
		case 9:
			return " 9 (über 150.000€)";
			break;
		case 10:
			return " 10 (über 250.000€)";
			break;
		default:
			return " 0 ";
			break;
	}
};

