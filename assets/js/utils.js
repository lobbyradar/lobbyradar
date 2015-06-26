var utils = {};

utils.displayEntity = function (entity) {
	var result = '<div class="entity">';

	if (entity) {

		result += utils.displayHeaderEntity(entity);

		result += utils.displayEntityRelations(entity);

		result += utils.displayEntityDonations(entity);

		result += utils.displayEntityCommittees(entity);

		result += utils.displayEntityAddIncome(entity);

		result += utils.displayEntityLinks(entity);

		result += utils.displayEntitySources(entity);

		result += utils.displayReportEntity(entity);

		result += utils.displayFooterEntity(entity);

	}

	result += '</div>';

	return result;
};

utils.displayHeaderEntity = function (entity) {

	var result = '<div class="row row-results">';

	var hasPhotos = false;
	$(entity.data).each(function (idx, data) {
		if (data.format == 'photo' && data.key == 'photo' && data.desc == 'Foto') {
			if (isExistant(data.value.url)) {
				result += '<div class="col-md-3"><div class="entity-img" style="background-image:url(' + data.value.url + ')" /></div>';
				hasPhotos = true;
				return false;
			}
		}
	});

	result += '<div class="col-md-' + (hasPhotos ? '9' : '12') + '">' +
		'<h1 class="name">';
	if (entity.type == 'person') {
		result += '<i class="fa fa-user"></i>&nbsp;'; // PERSON
	}
	var icon = '';
	var verified = false;
	$(entity.data).each(function (idx, d) {
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
	// Bundesland herausgenommen
	//$(entity.data).each(function (idx, data) {
	//  if (data.key == 'bundesland') {
	//    result += '<p>' + data.value + '</p>'; // PARTEI
	//  }
	//});
	$(entity.tags).each(function (idx, tag) {
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
	$(entity.data).each(function (idx, data) {
		if ((data.desc == 'Quelle') && (data.value.url !== undefined)) {
			result += '<div class="col-md-12">' +
				'<div class="entity-source">' +
				'<i class="fa fa-bookmark"></i> <a title="' + data.value.url + '" target="_blank" href="' + data.value.url + '">' + data.value.url + '</a>' +
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
	$(entity.data).each(function (idx, data) {
		if (data.key == 'link') {
			result += '<div class="col-md-12">' +
				'<div class="entity-link"><i class="fa fa-external-link"></i> <a title="' + data.value.url + '" target="_blank" href="' + data.value.url + '">' + data.value.url + '</a></div>' +
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

utils.displayEntityAddIncome = function (entity) {
	var result = '';
	if ((entity.type == 'person') && (entity.relations.length > 0)) {

		var collect = {};
		$(entity.relations).each(function (idx, rel) {
			if ((rel.tags.indexOf("nebentaetigkeit") >= 0) && isExistant(rel.data) && isExistant(rel.entity)) {
				rel.data.forEach(function (d) {
					if (d.format == 'activity') {
						var desc = d.value.desc || 'Nebentätigkeit';
						collect[desc] = collect[desc] || [];
						collect[desc].push({rel: rel, d: d});
					}
				});
			}
		});
		//TODO: reimplement sorting keys like before
		/*
		 a ["Berufliche Tätigkeit vor der Mitgliedschaft im Deutschen Bundestag",
		 b "Funktionen in Vereinen, Verbänden und Stiftungen" ,
		 c "Funktionen in Unternehmen" ,
		 d "Funktionen in Körperschaften und Anstalten des öffentlichen Rechts" ,
		 e "Entgeltliche Tätigkeiten neben dem Mandat" ,
		 f "Beteiligungen an Kapital- oder Personengesellschaften" ,
		 g "Vereinbarungen über künftige Tätigkeiten oder Vermögensvorteile"]
		 */
		Object.keys(collect).forEach(function (key) {
			var activities = collect[key];
			result += '<br /><h5>' + key + '</h5>';

			activities.forEach(function (o) {
				var rel = o.rel;

				var d = o.d;
				result += utils.formatEntityLink(rel.entity);
				var sl = [];
				if (d.value.start != null) {
					sl.push(d.value.start.year);
				} else if (d.value.end != null) {
					sl.push(d.value.end.year);
				}
				if (d.value.position != null) {
					sl.push(d.value.position);
				}
				if (d.value.activity != null) {
					sl.push(d.value.activity);
				}
				if (d.value.periodical != null) {
					sl.push(d.value.periodical);
				}
				if (d.value.level !== 0) {
					sl.push('Stufe: ' + utils.formatStagesAddIncome(d.value.level));
				}
				if (sl.length > 0) result += '<br/>' + sl.join(' ');
				result += '<br/>';
			});
		});

		if (result.length > 0) {
			result = '<div class="row row-results">' +
				'<div class="col-md-12"><h4><i class="fa fa-suitcase"></i>&nbsp;Tätigkeit neben dem Bundestagsmandat</h4></div>' +
				'<div class="entity-relations-item">' + result + '</div></div>';
		}
	}

	return result;
};

utils.displayEntityCommittees = function (entity) {
	var result = '';
	if (entity.relations.length > 0) {
		$(entity.relations).each(function (idx, rel) {
			// check for committee
			if ((rel.tags.indexOf('committee') >= 0) && isExistant(rel.entity)) {
				result += utils.formatEntityLink(rel.entity) + '<br/>';
			}
		});
	}
	if (result.length > 0) {
		result = '<div class="row row-results">' +
			'<div class="col-md-12"><h4><i class="fa fa-group"></i>&nbsp;Ausschüsse des Bundestags</h4></div>' +
			'<div class="entity-relations-item">' + result + '</div></div>';
	}
	return result;
};

utils.displayEntityDonations = function (entity) {
	var result = '';

	if (entity.relations.length > 0) {
		$(entity.relations).each(function (idx, rel) {
			var donations = rel.data.filter(function (data) {
				return (data.format == 'donation');
			});
			if (donations.length > 0) {
				if (isExistant(rel.entity)) {
					result += utils.formatEntityLink(rel.entity) + '<br/>';
				}
				result += '<table class="table-condensed table-bordered table">';
				$(donations).each(function (idx, data) {
					if (data.key == 'donation') {
						result += '<tr><td>' + data.value.year + ' </td>' +
							'<td>' + numberWithCommas(data.value.amount) + ' € </td></tr>';
					}
				});
				result += '</table>';
			}
		});
		if (result.length > 0) {
			var start = '<div class="row row-results">';
			var parteiString = 'Parteispende';
			if (entity.type == 'person') {
				parteiString += ' an ';
			} else if (entity.type == 'entity') {
				var s = ' an ';
				entity.tags.forEach(function (t) {
					if (t == 'partei') s = ' von ';
				});
				parteiString += s;
			}
			start += '<div class="col-md-12"><h4><i class="fa fa-euro"></i>&nbsp;' + parteiString + '</h4></div>' +
				'<div class="entity-relations-item">';
			result = start + result + '</div></div>';
		}
	}
	return result;
};

utils.displayEntityRelations = function (entity) {
	var result = '';
	if (entity.relations.length > 0) {
		var relations = entity.relations;
		result += '<h4>' + entity.relations.length + ' Verbindungen</<h4></h4>';
		result += '<div class="entity-relations-list">';
		$(entity.relations).each(function (idx, rel) {

			// failsafe check if relation has entity and id
			if (!(rel.hasOwnProperty("entity"))) return;// console.log("no entity", rel);
			if (rel.entity.hasOwnProperty("_id") && !(rel.entity.hasOwnProperty("id"))) rel.entity.id = rel.entity._id;
			if (!(rel.entity.hasOwnProperty("id")) || !rel.entity.id) return;// console.log("no id", rel)

			var activities = []; //nebeneinkünfte
			var donations = []; //spenden
			var jobs = []; // tätigkeiten (goverment, anstellungen, exeutive, memberships ...)
			var associations = []; // andere verbindungen (hausausweise, geschäftsverbindungen ...)
			var businesses = []; // besitzverhätnisse (tochterfirmen, anteile, ...)
			var everythingelse = []; //alles andere

			if (rel.data && rel.data.length > 0) {

				$(rel.data).each(function (idx, data) {
					if (data.format == 'job') jobs.push(data);
					else if (data.format == 'donation') donations.push(data);
					else if (data.format == 'activity') activities.push(data);
					else if (data.format == 'association') associations.push(data);
					else if (data.format == 'business') businesses.push(data);
					else everythingelse.push(data);
				});
			}

			if ((activities.length > 0) && isExistant(rel.entity)) {
				if (rel.tags.indexOf("nebentaetigkeit") >= 0) {
					// is nebentaetigkeit
					switch (entity.type) {
						case "person":
							//will be handled separately
							break;
						default:
							result += '<div class="entity-relations-item">' + utils.formatEntityLink(rel.entity) + '</div>';
							break;
					}
				} else {
					// is not nebentaetigkeit
					result += '<div class="entity-relations-item"><i class="fa fa-suitcase"></i>&nbsp;' + utils.formatEntityLink(rel.entity);
					// add activity from data
					$(activities).each(function (idx, data) {
						result += '<br/>' + data.value.position + ', ' + data.value.type;
					});
					result += '</div>';
				}
			}

			if (donations.length > 0) {
				hasPartyDonation = true;
				donationArray.push(rel);
			}

			var governments = jobs.filter(function (d) {
				return d.value && (d.value.type == 'government')
			});
			if (governments.length > 0) {
				result += '<div class="entity-relations-item"><i class="fa fa-institution"></i>&nbsp;' + utils.formatEntityLink(rel.entity);
				$(governments).each(function (idx, data) {
					// add position from data
					if (data.value.position) result += '<br/>' + data.value.position;
					var dateString = utils.formatSplitDateRange(data.value.start, data.value.end);
					if (dateString.length > 0) result += '<br/>' + dateString;
				});
				result += '</div>';
			}

			var memberships = jobs.filter(function (d) {
				return d.value && (d.value.type == 'member')
			});
			if (memberships.length > 0) {
				result += '<div class="entity-relations-item"><i class="fa fa-group"></i>&nbsp;' + utils.formatEntityLink(rel.entity);
				$(memberships).each(function (idx, data) {
					if (data.value.position) result += '<br/>' + data.value.position;
					else result += '<br/>Mitglied';
					var dateString = utils.formatSplitDateRange(data.value.start, data.value.end);
					if (dateString.length > 0) result += '<br/>' + dateString;
				});
				result += '</div>';
			}

			var otherjobs = jobs.filter(function (d) {
				return d.value && (d.value.type !== 'member') && (d.value.type !== 'government');
			});
			if (otherjobs.length > 0) {
				result += '<div class="entity-relations-item"><i class="fa fa-group"></i>&nbsp;' + utils.formatEntityLink(rel.entity);
				$(otherjobs).each(function (idx, data) {
					if (data.value.position) result += '<br/>' + data.value.position;
					var dateString = utils.formatSplitDateRange(data.value.start, data.value.end);
					if (dateString.length > 0) result += '<br/>' + dateString;
				});
				result += '</div>';
			}

			if (businesses.length > 0) {
				//TODO list businesses
				result += '<div class="entity-relations-item"><i class="fa fa-money"></i>&nbsp;' + utils.formatEntityLink(rel.entity) + '</div>';
			}

			var hausausweise = associations.filter(function (d) {
				return d.value && (d.value.type == 'pass') && (d.value.position == 'Hausausweise');
			});
			if (hausausweise.length > 0) {
				$(hausausweise).each(function (idx, data) {
					result += '<div class="entity-relations-item"><i class="fa fa-key"></i>&nbsp;';
					result += 'Hausausweis für: ' + utils.formatEntityLink(rel.entity);
					if (data.value.issued) result += '<br/>Ausgestellt von <em>' + data.value.issued + "</em>";
					result += '</div>';
				});
			}
			var otherassociations = associations.filter(function (d) {
				return d.value && (hausausweise.indexOf(d) < 0);
			});
			if (otherassociations.length > 0) {
				result += '<div class="entity-relations-item"><i class="fa fa-code-fork"></i>&nbsp;' + utils.formatEntityLink(rel.entity);
				$(otherassociations).each(function (idx, data) {
					if (data.value.position) result += '<br/>' + data.value.position;
					result += '</div>';
				});
			}

			if (everythingelse.length > 0) {
				result += '<div class="entity-relations-item"><i class="fa fa-share-alt"></i>&nbsp;' + utils.formatEntityLink(rel.entity) + '</div>';
				//TODO: list everything else
				$(everythingelse).each(function (idx, data) {
					//console.log('TODO: display relation data', data);
				});
			}

		});

		result += '</div>';
	}
	return result;
};

//formatters

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

