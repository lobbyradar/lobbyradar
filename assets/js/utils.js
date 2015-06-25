var utils = {};

utils.displayEntityRelations = function (entity) {
	var $content = '';
	if (entity.relations.length > 0) {
		var relations = entity.relations;
		$content += '<h4>' + entity.relations.length + ' Verbindungen</<h4></h4>';
		$content += '<div class="entity-relations-list">';
		$(entity.relations).each(function (idx, rel) {

			// failsafe check if relation has entity and id
			if (!(rel.hasOwnProperty("entity"))) return;// console.log("no entity", rel);
			if (rel.entity.hasOwnProperty("_id") && !(rel.entity.hasOwnProperty("id"))) rel.entity.id = rel.entity._id;
			if (!(rel.entity.hasOwnProperty("id")) || !rel.entity.id) return;// console.log("no id", rel)

			var compileDate = function (date) {
				var result = '';
				if (!date) return result;
				if (date.year) {
					if (date.month) {
						if (date.day) {
							result += date.day + '. ';
						}
						result += utils.getMonthName(date.month);
					}
					result += ' ' + date.year;
				}
				return result.trim();
			};

			var compileDateRange = function (start, end) {
				var result = '';
				var seit = compileDate(start);
				var bis = compileDate(end);
				if (seit.length > 0) result += 'seit ' + seit;
				if (bis.length > 0) result += ' bis ' + bis;
				return result;
			};

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

			if (activities.length > 0) {

				// is nebentaetigkeit
				if (rel.tags.indexOf("nebentaetigkeit") >= 0) {

					switch (entity.type) {
						case "person":
							hasAddIncome = true;
							// no entry for persons with activities?
							break;
						case "entity":
							$content += '<div class="entity-relations-item"><a class="ajax-load entity-connections" href="/entity/' + rel.entity.id + '">' + rel.entity.name + '</a></div>';
							break;
					}

					// is not nebentaetigkeit
				} else {

					$content += '<div class="entity-relations-item"><i class="fa fa-suitcase"></i>&nbsp;<a class="ajax-load entity-connections" href="/entity/' + rel.entity.id + '">' + rel.entity.name + '</a>';

					// add activity from data
					$(activities).each(function (idx, data) {
						$content += '<br/>' + data.value.position + ', ' + data.value.type;
					});

					$content += '</div>';

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
				$content += '<div class="entity-relations-item"><i class="fa fa-institution"></i>&nbsp;<a class="ajax-load entity-connections" href="/entity/' + rel.entity.id + '">' + rel.entity.name + '</a>';
				$(governments).each(function (idx, data) {
					// add position from data
					if (data.value.position) $content += '<br/>' + data.value.position;
					var dateString = compileDateRange(data.value.start, data.value.end);
					if (dateString.length > 0) $content += '<br/>' + dateString;
				});
				$content += '</div>';
			}

			var hausausweise = associations.filter(function (d) {
				return d.value && (d.value.type == 'pass') && (d.value.position == 'Hausausweis');
			});
			if (hausausweise.length > 0) {
				$(hausausweise).each(function (idx, data) {
					$content += '<div class="entity-relations-item"><i class="fa fa-key"></i>&nbsp;';
					$content += 'Hausausweis für: ';
					$content += '<a class="ajax-load entity-connections" href="/entity/' + rel.entity.id + '">' + rel.entity.name + '</a>';
					if (data.value.issued) $content += '<br/>Ausgestellt von <em>' + data.value.issued + "</em>";
					$content += '</div>';
				});
			}

			var memberships = jobs.filter(function (d) {
				return d.value && (d.value.type == 'member')
			});
			if (memberships.length > 0) {
				//TODO list memberships
				$content += '<div class="entity-relations-item"><i class="fa fa-group"></i>&nbsp;<a class="ajax-load entity-connections" href="/entity/' + rel.entity.id + '">' + rel.entity.name + '</a><br/>';
				$content += 'Mitglied</div>';
			}

			var otherjobs = jobs.filter(function (d) {
				return d.value && (d.value.type !== 'member') && (d.value.type !== 'government');
			});
			if (otherjobs.length > 0) {
				$(otherjobs).each(function (idx, data) {
					$content += '<div class="entity-relations-item"><i class="fa fa-group"></i>&nbsp;<a class="ajax-load entity-connections" href="/entity/' + rel.entity.id + '">' + rel.entity.name + '</a>';
					if (data.value.position) $content += '<br/>' + data.value.position;
					var dateString = compileDateRange(data.value.start, data.value.end);
					if (dateString.length > 0) $content += '<br/>' + dateString;
					$content += '</div>';
				});
			}

			if (businesses.length > 0) {
				$(businesses).each(function (idx, data) {
					$content += '<div class="entity-relations-item"><i class="fa fa-money"></i> <a class="ajax-load entity-connections" href="/entity/' + rel.entity.id + '">' + rel.entity.name + '</a></div>';
				});
			}

			var otherassociations = associations.filter(function (d) {
				return d.value && (d.value.type !== 'pass') && (d.value.position !== 'Hausausweis');
			});
			if (otherassociations.length > 0) {
				$(otherassociations).each(function (idx, data) {
					$content += '<div class="entity-relations-item"><i class="fa fa-code-fork"></i> <a class="ajax-load entity-connections" href="/entity/' + rel.entity.id + '">' + rel.entity.name + '</a>';
					if (data.value.position) $content += '<br/>' + data.value.position;
					$content += '</div>';
				});
			}

			if (everythingelse.length > 0) {
				$(everythingelse).each(function (idx, data) {
					//console.log('TODO',data);
					$content += '<div class="entity-relations-item"><i class="fa fa-share-alt" title="' + rel.type.toLowerCase() + '"></i> <a class="ajax-load entity-connections" href="/entity/' + rel.entity.id + '">' + rel.entity.name + '</a></div>';
				});
			}

		});

		$content += '</div>';
	}
	return $content;
};

utils.getMonthName = function(month) {
	switch (month){
		case 1:
			return "Januar";
			break;
		case 2:
			return "Februar";
			break;
		case 3:
			return "März";
			break;
		case 4:
			return "April";
			break;
		case 5:
			return "Mai";
			break;
		case 6:
			return "Juni";
			break;
		case 7:
			return "Juli";
			break;
		case 8:
			return "August";
			break;
		case 9:
			return "September";
			break;
		case 10:
			return "Oktober";
			break;
		case 11:
			return "November";
			break;
		case 12:
			return "Dezember";
			break;
		default:
			return "";
			break;
	}
};
