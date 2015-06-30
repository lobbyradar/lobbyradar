var utils = {};

utils.displayEntityTabs = function (entity, tabs) {
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

utils.displayEntity = function (entity) {
	var result = '<div class="entity">';
	if (!entity)  return result + '</div';

	result += utils.displayHeaderEntity(entity);

	result += utils.displayEntityRelations(entity);

	result += utils.displayReportEntity(entity);

	result += utils.displayFooterEntity(entity);

	result += '</div>';

	return result;
};

utils.displayEntityRelations = function (entity) {
	if (entity.relations.length == 0) return '';

	var result = '';

	var collect = {
		governments: {id: 'governments', name: 'Politische Positionen', list: [], format: utils.displayGeneric},
		memberships: {id: 'memberships', name: 'Mitgliedschaften', list: [], format: utils.displayGeneric},
		otherjobs: {id: 'otherjobs', name: 'Arbeitsverhältnisse', list: [], format: utils.displayGeneric},
		hausausweise: {id: 'hausausweise', name: 'Hausausweise', list: [], format: utils.displayGeneric},
		businesses: {id: 'businesses', name: 'Geschäftsverbindungen', list: [], format: utils.displayGeneric},
		activities: {id: 'activities', name: 'Arbeitgeberschaft', list: [], format: utils.displayGeneric},
		otherassociations: {id: 'otherassociations', name: 'Verbindungen', list: [], format: utils.displayGeneric},
		everythingelse: {id: 'everythingelse', name: 'Verbindungen', list: [], format: utils.displayGeneric},
		nebentaetigkeiten: {id: 'nebentaetigkeiten', name: 'Nebeneinkünfte', list: [], format: utils.displayAddIncomes},
		donations: {id: 'donations', name: 'Parteispenden', list: [], format: utils.displayDonations},
		committees: {id: 'committees', name: 'Ausschüsse', list: [], format: utils.displayCommittees},
		links: {id: 'links', name: 'Links', list: [], format: utils.displayEntityLinks},
		source: {id: 'source', name: 'Quellen', list: [], format: utils.displayEntitySources}
	};

	entity.relations.forEach(function (rel) {

		// failsafe check if relation has entity and id
		if (!(rel.hasOwnProperty("entity"))) return;// console.log("no entity", rel);
		if (rel.entity.hasOwnProperty("_id") && !(rel.entity.hasOwnProperty("id"))) rel.entity.id = rel.entity._id;
		if (!(rel.entity.hasOwnProperty("id")) || !rel.entity.id) return;// console.log("no id", rel)

		var activities = []; //nebeneinkünfte
		var jobs = []; // tätigkeiten (goverment, anstellungen, exeutive, memberships ...)
		var associations = []; // andere verbindungen (hausausweise, geschäftsverbindungen ...)
		var businesses = []; // besitzverhätnisse (tochterfirmen, anteile, ...)
		var donations = []; // parteispenden
		var everythingelse = []; //alles andere

		if (rel.data && rel.data.length > 0) {
			rel.data.forEach(function (d) {
				if (d.format == 'job') jobs.push(d);
				else if (d.format == 'activity') activities.push(d);
				else if (d.format == 'association') associations.push(d);
				else if (d.format == 'business') businesses.push(d);
				else if (d.format == 'donation') donations.push(d);
				else everythingelse.push(d);
			});
		}

		if ((activities.length > 0) && isExistant(rel.entity)) {
			if (rel.tags.indexOf("nebentaetigkeit") >= 0) {
				// is nebentaetigkeit
				switch (entity.type) {
					case "person":
						collect.nebentaetigkeiten.push({rel: rel, list: activities});
						break;
					default:
						collect.activities.list.push({rel: rel, list: activities, format: utils.formatActivity, icon: 'fa-group'});
						break;
				}
			} else {
				// is not nebentaetigkeit
				collect.activities.list.push({rel: rel, list: activities, format: utils.formatActivity, icon: 'fa-suitcase'});
			}
		}

		var governments = jobs.filter(function (d) {
			return d.value && (d.value.type == 'government')
		});
		if (governments.length > 0) {
			collect.governments.list.push({rel: rel, list: governments, format: utils.formatJob, icon: 'fa-institution'});
		}

		var memberships = jobs.filter(function (d) {
			return d.value && (d.value.type == 'member')
		});
		if (memberships.length > 0) {
			collect.memberships.list.push({
				rel: rel, list: memberships, format: function (data) {
					return utils.formatJob(data, 'Mitglied');
				}, icon: 'fa-group'
			});
		}

		var otherjobs = jobs.filter(function (d) {
			return d.value && (memberships.indexOf(d) < 0) && (governments.indexOf(d) < 0);
		});
		if (otherjobs.length > 0) {
			collect.otherjobs.list.push({rel: rel, list: otherjobs, format: utils.formatJob, icon: 'fa-group'});
		}

		if (businesses.length > 0) {
			collect.businesses.list.push({rel: rel, list: businesses, format: utils.formatBusiness, icon: 'fa-money'});
		}

		if (donations.length > 0) {
			collect.donations.list.push({rel: rel, list: donations});
		}

		var hausausweise = associations.filter(function (d) {
			return d.value && (d.value.type == 'pass') && (d.value.position == 'Hausausweise');
		});
		if (hausausweise.length > 0) {
			collect.hausausweise.list.push({rel: rel, list: hausausweise, format: utils.formatHausausweis, icon: 'fa-key', prefix: 'Hausausweis für: '});
		}

		var commitees = associations.filter(function (d) {
			return d.value && (d.type == 'commitee');
		});
		if ((rel.tags.indexOf('committee') >= 0) || commitees.length > 0) {
			collect.commitees.list.push({rel: rel, list: commitees});
		}

		var otherassociations = associations.filter(function (d) {
			return d.value && (hausausweise.indexOf(d) < 0);
		});
		if (otherassociations.length > 0) {
			collect.otherassociations.list.push({rel: rel, list: otherassociations, format: utils.formatAssociation, icon: 'fa-code-fork'});
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

	result += utils.displayEntityTabs(entity, tabs);

	return result;
};

utils.displayGeneric = function (entity, tab) {
	var result = '';
	var list = tab.list.sort(function (a, b) {
		if (a.rel.entity.name < b.rel.entity.name) return -1;
		if (a.rel.entity.name > b.rel.entity.name) return 1;
		return 0;
	});
	list.forEach(function (r) {
		result += utils.formatRelation(r.rel, r.list, r.format, r.icon, r.prefix);
	});
	if (result.length > 0) {
		result = '<h4>' + tab.name + ': ' + tab.list.length + '</h4>' +
			'<div class="entity-relations-list">' + result + '</div>';
	}
	return result;
};

utils.displayHeaderEntity = function (entity) {

	var result = '<div class="row row-results">';

	var photos = entity.data.filter(function (d) {
		return (d.format == 'photo' && d.key == 'photo' && d.desc == 'Foto' && isExistant(d.value.url));
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
		result += '<i id="certified" class="fa fa-check-square-o"></i>';
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

utils.displayFooterEntity = function (entity) {
	var result = '<div class="row"><br/>' +
		'<div class="col-sm-12">' +
		'<p class="meta">' +
		'<span>Erstellt: ' + moment(entity.created).format("DD.MM.YYYY hh:mm") + '</span><br/>' +
		'<span>Aktualisiert: ' + moment(entity.created).format("DD.MM.YYYY hh:mm") + '</span>' +
		'</p>' +
		'</div></div>';
	return result;
};

utils.displayReportEntity = function (entity) {
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

utils.displayEntitySources = function (entity) {
	var result = '';
	entity.data.forEach(function (d) {
		if ((d.desc == 'Quelle') && (d.value.url)) {
			result += '<div class="col-md-12">' +
				'<div class="entity-source">' +
				'<i class="fa fa-bookmark"></i> <a title="' + d.value.url + '" target="_blank" href="' + d.value.url + '">' + d.value.url + '</a>' +
				'</div></div>';
		}
	});
	if (result.length > 0) {
		result = '<div class="row row-results">' +
			'<div class="col-md-12"><h4>Quellen</h4></div>' + result +
			'</div>';
	}
	return result;
};

utils.displayEntityLinks = function (entity) {
	var result = '';
	entity.data.forEach(function (d) {
		if (d.key == 'link') {
			result += '<div class="col-md-12">' +
				'<div class="entity-link"><i class="fa fa-external-link"></i> <a title="' + d.value.url + '" target="_blank" href="' + d.value.url + '">' + d.value.url + '</a></div>' +
				'</div>';
		}
	});
	if (result.length > 0) {
		//console.log('Entity has Links');
		result = '<div class="row row-results">' +
			'<div class="col-md-12"><h4>Links</h4></div>' + result +
			'</div>';
	}
	return result;
};

utils.displayDonations = function (entity, donations) {
	var result = '';
	donations.list.forEach(function (r) {
		result += utils.formatEntityLink(r.rel.entity) + '<br/>';
		r.list.sort(function (a, b) {
			return b.value.year - a.value.year;
		});
		result += '<table class="table-condensed table-bordered table">';
		r.list.forEach(function (data) {
			result += '<tr><td>' + data.value.year + ' </td>' +
				'<td>' + numberWithCommas(data.value.amount) + ' € </td></tr>';
		});
		result += '</table>';
	});
	if (result.length > 0) {
		var start = '<div class="row row-results">';
		var parteiString = 'Parteispende';
		if (entity.type == 'person') {
			parteiString += ' an ';
		} else if (entity.type == 'entity') {
			parteiString += (entity.tags.indexOf('partei') >= 0) ? ' von ' : ' an ';
		}
		start += '<div class="col-md-12"><h4><i class="fa fa-euro"></i>&nbsp;' + parteiString + '</h4></div>' +
			'<div class="entity-relations-item">';
		result = start + result + '</div></div>';
	}
	return result;
};

utils.displayAddIncomes = function (entity, nebentaetigkeiten) {
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
	var nebeneinkunft_result = '';
	Object.keys(nebeneinkunft_collect).forEach(function (key) {
		result += '<br /><h5>' + key + '</h5>';
		nebeneinkunft_collect[key].forEach(function (r) {
			nebeneinkunft_result += utils.formatEntityLink(r.rel.entity);
			var s = utils.formatNebeneinkunft(r.d);
			if (s.length > 0) result += '<br/>' + s;
			nebeneinkunft_result += '<br/>';
		});
	});
	if (nebeneinkunft_result.length > 0) {
		result = '<div class="row row-results">' +
			'<div class="col-md-12"><h4><i class="fa fa-suitcase"></i>&nbsp;Tätigkeit neben dem Bundestagsmandat</h4></div>' +
			'<div class="entity-relations-item">' + nebeneinkunft_result + '</div></div>';
	}

	return result;
};

utils.displayCommittees = function (entity, committees) {
	var result = '';
	committees.list.forEach(function (r) {
		result += utils.formatEntityLink(r.rel.entity) + '<br/>';
	});
	if (result.length > 0) {
		result = '<div class="row row-results">' +
			'<div class="col-md-12"><h4><i class="fa fa-group"></i>&nbsp;Ausschüsse des Bundestags</h4></div>' +
			'<div class="entity-relations-item">' + result + '</div></div>';
	}
	return result;
};

//formatters

utils.formatRelation = function (rel, datalist, formatter, icon, nameprefix) {
	var result = '<div class="entity-relations-item"><i class="fa ' + icon + '"></i>&nbsp;' + (nameprefix ? nameprefix : '') + utils.formatEntityLink(rel.entity);
	// add activity from data
	datalist.forEach(function (data) {
		result += formatter(data);
	});
	result += '</div>';
	return result;
};

utils.formatBusiness = function (data) {
	var result = '';
	if (data.value.position) result += '<br/>' + data.value.position;
	var dateString = utils.formatSplitDateRange(data.value.start, data.value.end);
	if (dateString.length > 0) result += '<br/>' + dateString;
	return result;
};

utils.formatJob = function (data, defaultposition) {
	var result = '';
	if (data.value.position) result += '<br/>' + data.value.position;
	else if (defaultposition)result += '<br/>' + defaultposition;
	var dateString = utils.formatSplitDateRange(data.value.start, data.value.end);
	if (dateString.length > 0) result += '<br/>' + dateString;
	return result;
};

utils.formatActivity = function (data) {
	var result = '';
	if (data.value.position) result += '<br/>' + data.value.position;
	var dateString = utils.formatSplitDateRange(data.value.start, data.value.end);
	if (dateString.length > 0) result += '<br/>' + dateString;
	return result;
};

utils.formatNebeneinkunft = function (data) {
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
	if (data.value.periodical != null) {
		sl.push(data.value.periodical);
	}
	if (data.value.level !== 0) {
		sl.push('Stufe: ' + utils.formatStagesAddIncome(data.value.level));
	}
	return sl.join(' ');
};

utils.formatHausausweis = function (data) {
	var result = '';
	if (data.value.desc) result += '<br/>Ausgestellt von <em>' + data.value.desc + "</em>";
	return result;
};

utils.formatAssociation = function (data) {
	var result = '';
	if (data.value.position) result += '<br/>' + data.value.position;
	var dateString = utils.formatSplitDateRange(data.value.start, data.value.end);
	if (dateString.length > 0) result += '<br/>' + dateString;
	return result;
};

utils.formatEntityLink = function (entity) {
	var result = '';
	if (isExistant(entity) && isExistant(entity._id)) {
		result = '<a class="ajax-load entity-connections" href="/entity/' + entity._id + '">';
		if (isExistant(entity.name)) {
			result += entity.name + '&nbsp;';
		}
		result += '</a>';
	}
	return result;
};

utils.formatSplitDate = function (date) {
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

utils.formatSplitDateRange = function (start, end) {
	var result = '';
	var seit = utils.formatSplitDate(start);
	var bis = utils.formatSplitDate(end);
	if (seit.length > 0) result += 'seit ' + seit;
	if (bis.length > 0) result += ' bis ' + bis;
	return result;
};

utils.formatStagesAddIncome = function (val) {
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

