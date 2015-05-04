/**
 * Created by Letty on 20/04/15.
 */

$(document).ready(function () {

	var trans_x = 0,
		trans_y = 0;
	var g;

	var w = $('#rel_viz').innerWidth(),
		h = $('#rel_viz').innerHeight() - 130;

	d3.selection.prototype.moveToFront = function () {
		return this.each(function () {
			this.parentNode.appendChild(this);
		});
	};

	var tooltip = d3.select("#rel_viz")
		.append("div")
		.attr("class", "overdings")
		.attr("id", "tip")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden");

	// ruestung, verkehr, pharma, bank, seitenwechsler
	var url = window.location.href; // get the url
	var id = url.split("/")[4]; // extract ID
	if (id == '') id = 'ruestung';

	// we change the selected value from the dropdown to current relation
	$("form.theme-switch select").val("/relation/"+id);
	// we inserted an empty option to prevent flickering and now we remove it
	$("form.theme-switch select option[value='']").remove();

	req = $.getJSON("/api/relation/tagged/" + id, function (data) {
		var links = [];
		var nodes = {};

		function rad(v) { return 30*Math.sqrt(v) };

		links = data.result.filter(function (relation) {
			if (!relation.entities[0]) return false;
			if (!relation.entities[1]) return false;
			return true;
		});

		links = links.map(function (relation) {
			var source = relation.entities[0];
			var target = relation.entities[1];

			return {
				source: nodes[source._id] || (nodes[source._id] = source),
				target: nodes[target._id] || (nodes[target._id] = target)
			};
		});


		var parent = d3.select('#rel_viz');

		var min = 1e10,
			max = -1e10;

		var force = d3.layout.force()
			.nodes(d3.values(nodes))
			.links(links)
			.gravity(0.2)
			.linkDistance(140)
			.charge(function (node) { return -300*rad(node.weight) })
			.theta(0.4)
			.on("tick", tick)
			.start();

		var svg = d3.select("#rel_viz").append("svg")
			.attr("width", w)
			.attr("height", h);
		g = svg.append('g');

		var link = g.selectAll(".link")
			.data(force.links())
			.enter().append("line")
			.attr("class", "link")
			.style('fill', 'none')
			.style('stroke', 'rgb(20,59,82)')
			.style('stroke-width', '1.5px');

		var node = g.selectAll(".node")
			.data(force.nodes())
			.enter().append("circle")
			.attr("class", "node")
			.on("mouseover", function (d) {
				var x = parseFloat(this.getAttribute('cx')) + trans_x;
				var y = parseFloat(this.getAttribute('cy')) + trans_y;
				var r = parseFloat(this.getAttribute('r'));
				return tooltip.style("visibility", "visible")
					.style("top", (y) + "px")
					.style("left", (x+r) + "px")
					.text(d.name);
			})
			.on("mouseout", function (d) {
				return tooltip.style("visibility", "hidden");
			})
			.on('click', clickHandler)
			.on('touchstart', clickHandler)
			.style('fill', function (d) {
				if (d.type == 'person') {
					return '#fee915';
				} else if (d.type == 'entity') {
					return '#a3db19';
				}
			});



		links.forEach(function (l) {
			if (l.source.weight < min) {
				min = l.source.weight;
			}
			if (l.source.weight > max) {
				max = l.source.weight;
			}
			if (l.target.weight < min) {
				min = l.target.weight;
			}
			if (l.target.weight > max) {
				max = l.target.weight;
			}
		});

		d3.selectAll('circle')
			.attr('r', function (d) {
				return rad(d.weight);
			});

		var scale = 1;
		function tick() {
			var maxR = 1;

			node.data().forEach(function (n) {
				var r = Math.sqrt(n.x * n.x + n.y * n.y) + rad(n.weight);
				if (r > maxR) maxR = r;
			});

			var newScale = 0.48 * Math.min(w, h) / maxR;
			scale = Math.pow(Math.pow(scale, 10)*newScale, 1/11);

			link
				.attr("x1", function (d) {
					return scale * d.source.x + w / 2;
				})
				.attr("y1", function (d) {
					return scale * d.source.y + h / 2;
				})
				.attr("x2", function (d) {
					return scale * d.target.x + w / 2;
				})
				.attr("y2", function (d) {
					return scale * d.target.y + h / 2;
				})
				.attr("stroke-opacity", function (d) {
					return Math.min(1,scale*10);
				})

			node
				.attr("cx", function (d) {
					return scale * d.x + w / 2;
				})
				.attr("cy", function (d) {
					return scale * d.y + h / 2;
				})
				.attr("r", function (d) {
					return scale * rad(d.weight);
				});
		}

		function mouseover() {
			d3.select(this).moveToFront();
			d3.select(this).select("text").transition()
				.duration(750)
				.style("display", 'block');
		}

		function mouseout() {
			d3.select(this).select("text").transition()
				.duration(750)
				.style("display", 'none');
		}

	});

	var clickHandler = function (d) {
		loadEntity2(d._id);
		trans_x = (-w/4);
		trans_y = 0;
		g.transition()
			.attr('transform', "translate("+trans_x+", "+trans_y+")")
			.duration(2000);
		var x = parseFloat(this.getAttribute('cx')) + trans_x;
		var y = parseFloat(this.getAttribute('cy')) + trans_y;
		var r = parseFloat(this.getAttribute('r'));
		return tooltip.transition().
			style("visibility", "visible")
			.style("top", (y) + "px")
			.style("left", (x+r) + "px")
			.text(d.name)
			.duration(2000);
	}


	// load an entity from ID and build up html
// used in Deeplink and Detail from List
	function loadEntity2(id) {

		$(".leaflet-control-zoom").css("display", 'block');

		var req = null;
		if (req) {
			req.abort();
		}
		$(".result-list").slideUp("slow");
		$('.fullscreen').animate({scrollTop: 0});

		$("#backtolist").css("display", 'inline-block'); // always show the backbutton

		req = $.getJSON("/api/entity/get/" + id, {relations: true}, function (data) {
			var $content = '<div class="entity">';

			if (data.hasOwnProperty("result")) {
				var entity = data.result;
				var hasAddIncome = false;
				var isCommittee = false;
				var hasPartyDonation = false;
				var donationArray = [];

				// check for the different types of data
				for (var i = 0, data; data = entity.data[i]; i++) {
					if (data.format == 'photo' && data.key == 'photo' && data.desc == 'Foto') {
						var hasPhotos = true;
					}
					if (data.desc == 'Quelle') {
						var hasSource = true;
					}
					if (data.key == 'address') {
						var hasAddress = true;
					}
					if (data.key == 'link') {
						var hasLinks = true;
					}
				}

				$content += '<div class="row row-results">';

				if (hasPhotos) {
					console.log('Entity has Photos');
					$(entity.data).each(function (idx, data) {
						if (data.format == 'photo' && data.key == 'photo' && data.desc == 'Foto') {
							if (isExistant(data.value.url)) {
								$content += '<div class="col-md-3"><div class="entity-img" style="background-image:url(' + data.value.url + ')" /></div>';
								return false;
							}
						}
					});
				}

				// title
				$content += '<div class="col-md-9">';
				$content += '<h1 class="name">';
				if (entity.type == 'person') {
					$content += '<i class="fa fa-user"></i>&nbsp;'; // PERSON
				}
				var icon = '';
				$(entity.data).each(function (idx, e) {
					if (entity.type == 'entity' && e.key == 'partei') {
						console.log('pie chart?');
						icon =  '<i class="fa fa-pie-chart"></i>&nbsp;'; // PARTEI
					} else if (entity.type == 'entity' && e.key == 'legalform') {
						console.log('whatever?');
						icon = '<i class="fa fa-building-o"></i>&nbsp;'; // PARTEI
					}
				});
				$content += icon;
				$content += entity.name;
				$content += '</h1>';
				// Bundesland herausgenommen
				//$(entity.data).each(function (idx, data) {
				//  if (data.key == 'bundesland') {
				//    $content += '<p>' + data.value + '</p>'; // PARTEI
				//  }
				//});
				$(entity.tags).each(function (idx, tag) {
					if (tag == 'mdb') {
						$content += '<p>Mitglied des Bundestages</p>';
					} else if (tag == 'lobbyist') {
						$content += '<p>LobbyistIn / InteressensvertreterIn</p>'
					} else if (tag == 'anwaltskanzlei') {
						$content += '<p>Anwaltskanzlei</p>'
					} else if (tag == 'committee') {
						$content += '<p>Ausschuss des Bundestags</p>'
					} else if (tag == 'lobbyorganisation') {
						$content += '<p>Lobbyismus-Organisation registriert beim Deutschen Bundestag</p>'
					} else if (tag == 'thinktank') {
						$content += '<p>Think Tank</p>'
					} else if (tag == 'dax' && entity.type == 'entity') {
						$content += '<p>Dax-Konzern</p>'
					} else if (tag == 'pr-und-lobbyagentur') {
						$content += '<p>Lobbyismus-Agentur</p>'
					}
				});
				$content += '</div>';

				$content += '</div>';


				if (entity.relations.length > 0) {
					// var relations = entity.relations.sort(sort_by('entity[name]', true));
					var relations = entity.relations;
					$content += '<h4>'+ entity.relations.length +' Verbindungen</<h4></h4>';
					$content += '<div class="entity-relations-list">';

					$(entity.relations).each(function (idx, rel) {

						// failsafe check if relation has entity and id
						if (!(rel.hasOwnProperty("entity"))) return console.log("no entity", rel);
						if (rel.entity.hasOwnProperty("_id") && !(rel.entity.hasOwnProperty("id"))) rel.entity.id = rel.entity._id;
						if (!(rel.entity.hasOwnProperty("id")) || !rel.entity.id) return console.log("no id", rel)

						// check for committee
						isCommittee = (rel.tags.indexOf('committee') >= 0);

						switch (rel.type.toLowerCase()) {
							// activities
							case "activity":

								// is nebentaetigkeit
								if (rel.tags.indexOf("nebentaetigkeit") >= 0) {

									switch (entity.type) {
										case "person":
											hasAddIncome = true;
											// no entry for persons with activities?
											break;
										case "entity":
											$content += '<div class="entity-relations-item"><a class="ajax-load entity-connections" href="/entity/'+rel.entity.id+'">'+rel.entity.name+'</a></div>';
											break;
									}

									// is not nebentaetigkeit
								} else {

									$content += '<div class="entity-relations-item"><i class="fa fa-suitcase"></i>&nbsp;<a class="ajax-load entity-connections" href="/entity/'+rel.entity.id+'">'+rel.entity.name+'</a>';

									// add activity from data
									$(rel.data).each(function (idx, data) {
										if (data.key == 'activity') $content += '<br/>'+data.value.position+', '+data.value.type;
									});

									$content += '</div>';

								}

								break;
							// donations
							case "donation":
								hasPartyDonation = true;
								donationArray.push(rel);
								break;
							// position or governments, oddly treated the same
							case "government":
								$content += '<div class="entity-relations-item"><i class="fa fa-institution"></i>&nbsp;<a class="ajax-load entity-connections" href="/entity/'+rel.entity.id+'">'+rel.entity.name+'</a>';

								// add position from data
								var dateString = '';
								var begin = '<br/> seit ';
								$(rel.data).each(function (idx, data) {
									if (data.key == 'position') $content += '<br/>'+data.value;
									if(data.key == 'begin') {
										var d = new Date(data.value);
										dateString += (d.getDate() - 1)+ '. ' + getMonthName(d.getMonth())+ ' '+ d.getFullYear();
									}
									if(data.key == 'end') {
										var d = new Date(data.value);
										begin = '<br/>';
										dateString += ' bis ' +(d.getDate() - 1)+ '. '+ getMonthName(d.getMonth())+ ' '+ d.getFullYear()+'<br/>';
									}
								});

								$content = $content + begin + dateString;
								$content += '</div>';

								break;
							// hausausweise
							case "hausausweise":

								$content += '<div class="entity-relations-item"><i class="fa fa-key"></i>&nbsp;';
								$content += 'Hausausweis für: ';
								$content += '<a class="ajax-load entity-connections" href="/entity/'+rel.entity.id+'">'+rel.entity.name+'</a>';

								$(rel.data).each(function (idx, data) {
									if (data.key == 'issues') $content += '<br/>Ausgestellt von <em>'+data.value+"</em>";
								});

								$content += '</div>';

								break;
							// members of something. could be parties.
							case "member":
							// also: mitglied, because we love consistency #FIXME #WTF #DIEINAFIRE
							case "mitglied":
								$content += '<div class="entity-relations-item"><i class="fa fa-group"></i>&nbsp;<a class="ajax-load entity-connections" href="/entity/'+rel.entity.id+'">'+rel.entity.name+'</a><br/>Mitglied</div>';
								break;
							// executives
							case "position":
								$content += '<div class="entity-relations-item"><i class="fa fa-user"></i>&nbsp;<a class="ajax-load entity-connections" href="/entity/'+rel.entity.id+'">'+rel.entity.name+'</a>';
								(rel.tags).forEach(function (t) {
									if(t == 'seitenwechsler'){
										// add position from data
										var dateString = '';
										var begin = '<br/> seit ';
										$(rel.data).each(function (idx, data) {
											if (data.key == 'position'){
												$content += '<br/>'+data.value;
												begin = '<br/>';
											}
											if(data.key == 'begin') {
												begin = '<br/> seit ';
												dateString = '' +  getMonthName(data.value.month)+ ' ' + data.value.year;
											}
											if(data.key == 'end') {
												begin = '<br/>';
												dateString += ' bis ' +  getMonthName(data.value.month)+ ' ' + data.value.year + '<br/>';
											}
										});

										$content = $content + begin + dateString;
									}
								});
								$content += '</div>';
								break;
							case "executive":

								$content += '<div class="entity-relations-item"><i class="fa fa-user"></i>&nbsp;<a class="ajax-load entity-connections" href="/entity/'+rel.entity.id+'">'+rel.entity.name+'</a>'

								$(rel.data).each(function (idx, data) {
									if (data.key === 'position') $content += '<br />'+data.value;
								});

								$content += '</div>';

								break;
							// business, whatever that may be
							case "business":
								$content += '<div class="entity-relations-item"><i class="fa fa-money"></i> <a class="ajax-load entity-connections" href="/entity/'+rel.entity.id+'">'+rel.entity.name+'</a></div>';
								break;
							case "association":
								$content += '<div class="entity-relations-item"><i class="fa fa-code-fork"></i> <a class="ajax-load entity-connections" href="/entity/'+rel.entity.id+'">'+rel.entity.name+'</a></div>';
								break;
							// generic display for everything else
							default:
								$content += '<div class="entity-relations-item"><i class="fa fa-share-alt" title="'+rel.type.toLowerCase()+'"></i> <a class="ajax-load entity-connections" href="/entity/'+rel.entity.id+'">'+rel.entity.name+'</a></div>';
								break;
						};

					});

					$content += '</div>';
				}

				if (hasPartyDonation) {
					console.log('Entity has party donation');
					$content += '<div class="row row-results">';
					var parteiString = 'Parteispende';

					if (entity.type == 'person') {
						parteiString += ' an ';
					} else if (entity.type == 'entity') {
						var s = ' an ';
						entity.tags.forEach(function (t) {
							if(t == 'partei') s = ' von ';
						})
						parteiString += s;
					}

					$content += '<div class="col-md-12"><h4><i class="fa fa-euro"></i>&nbsp;' + parteiString + '</h4></div>';
					$content += '<div class="entity-relations-item">';

					donationArray.forEach(function (d) {
						if (isExistant(d.entity)) {
							$content += '<a class="ajax-load entity-connections" href="/entity/'
							if (isExistant(d.entity._id)) {
								$content += d.entity._id;
							}
							$content += '">';
							if (isExistant(d.entity.name)) {
								$content += d.entity.name + '&nbsp;';
							}
						}
						$content += '</a><br/>';
						if (isExistant(d.data)) {
							$content += '<table class="table-condensed table-bordered table">';
							$(d.data).each(function (idx, data) {
								if (data.key == 'donation') {
									$content += '<tr>';
									$content += '<td>';
									$content += data.value.year + ' ';
									$content += '</td>';
									$content += '<td>';
									$content += numberWithCommas(data.value.amount) + ' € ';
									$content += '</td>';
									$content += '</tr>';
								}
							});
							$content += '</table>';
						}
					});
					$content += '</div>';
					$content += '</div>';
				}

				//if a person is a part of a committee
				if (isCommittee) {
					console.log('Entity is a part of a committee');
					$content += '<div class="row row-results">';
					$content += '<div class="col-md-12"><h4><i class="fa fa-group"></i>&nbsp;Ausschüsse des Bundestags</h4></div>';
					$content += '<div class="entity-relations-item">';

					var e = entity.relations;

					e.forEach(function (r) {
						var tags = r.tags;
						tags.forEach(function (t) {
							if (t == 'committee') {
								$content += '<a class="ajax-load entity-connections" href="/entity/';
								if (isExistant(r.entity)) {
									if (isExistant(r.entity._id)) {
										$content += r.entity._id;
									}
									$content += '">';
									if (isExistant(r.entity.name)) {
										$content += r.entity.name + '&nbsp;';
									}
								}
								$content += '</a><br/>';
							}
						});
					});
					$content += '</div>';
					$content += '</div>';
				}

				// if a person has additional income
				//
				if (hasAddIncome) {
					if (entity.type == 'person') {
						console.log('Entity has additional income');
						$content += '<div class="row row-results">';
						$content += '<div class="col-md-12"><h4><i class="fa fa-suitcase"></i>&nbsp;Tätigkeit neben dem Bundestagsmandat</h4></div>';
						$content += '<div class="entity-relations-item">';
						var e = entity.relations;

						/*
						 a ["Berufliche Tätigkeit vor der Mitgliedschaft im Deutschen Bundestag",
						 b "Funktionen in Vereinen, Verbänden und Stiftungen" ,
						 c "Funktionen in Unternehmen" ,
						 d "Funktionen in Körperschaften und Anstalten des öffentlichen Rechts" ,
						 e "Entgeltliche Tätigkeiten neben dem Mandat" ,
						 f "Beteiligungen an Kapital- oder Personengesellschaften" ,
						 g "Vereinbarungen über künftige Tätigkeiten oder Vermögensvorteile"]
						 */

						var _a = '';
						var _b = '';
						var _c = '';
						var _d = '';
						var _e = '';
						var _f = '';
						var _g = '';

						var ob = [];

						e.forEach(function (r) {
							var tags = r.tags;
							tags.forEach(function (t) {
								var zuordnung = '';
								if (t == 'nebentaetigkeit') {
									zuordnung += '<a class="ajax-load entity-connections" href="/entity/';
									if (isExistant(r.entity)) {
										if (isExistant(r.entity._id)) {
											zuordnung += r.entity._id;
										}
										zuordnung += '">';
										if (isExistant(r.entity.name)) {
											zuordnung += r.entity.name + '&nbsp;';
										}
									}
									zuordnung += '</a><br/>';

									if (isExistant(r.data)) {
										r.data.forEach(function (d) {
											if (d.value.type == 'Berufliche Tätigkeit vor der Mitgliedschaft im Deutschen Bundestag') {
												_a += zuordnung;
												_a += d.value.year + ' ' + data.value.position + ' ' + d.value.activity + ' ' + d.value.periodical + '<br>';
											} else if (d.value.type == 'Funktionen in Vereinen, Verbänden und Stiftungen') {
												_b += zuordnung;
												_b += d.value.position + '<br>';
											} else if (d.value.type == 'Funktionen in Unternehmen') {
												_c += zuordnung;
												//_c += d.value.position + '<br>';
												if (d.value.year != null) {
													_c += d.value.year + ' ';
												}
												if (d.value.position != null) {
													_c += d.value.position + ' ';
												}
												if (d.value.activity != null ) {
													_c += d.value.activity + ' ';
												}
												if(d.value.level !== 0){
													_c += d.value.periodical + ' Stufe: ' + formatStagesAddIncome(d.value.level);
												}
												_c += '<br>';

											} else if (d.value.type == 'Funktionen in Körperschaften und Anstalten des öffentlichen Rechts') {
												_d += zuordnung;
												_d += d.value.position + '<br>';
											} else if (d.value.type == 'Entgeltliche Tätigkeiten neben dem Mandat') {
												ob.push(r);
											} else if (d.value.type == 'Beteiligungen an Kapital- oder Personengesellschaften') {
												_f += zuordnung;
												//_f += data.value.position + '<br>';
											} else if (d.value.type == 'Vereinbarungen über künftige Tätigkeiten oder Vermögensvorteile') {
												_g += zuordnung;
												_g += d.value.activity + ' ' + d.value.periodical + '<br>';
											}
										})
										zuordnung = '';
									}
								}
							});

						});

						ob.sort(function(a, b){ return a-b; });

						var i = 0,
							j = 1;
						for (; j < ob.length;) {
							if (ob[i]._id == ob[j]._id) {
								ob.splice(i, 1);
							} else {
								i++;
								j++;
							}
						}


						ob.forEach(function (d) {
							var zuordnung = '';
							zuordnung += '<a class="ajax-load entity-connections" href="/entity/';
							if (isExistant(d.entity)) {
								if (isExistant(d.entity._id)) {
									zuordnung += d.entity._id;
								}
								zuordnung += '">';
								if (isExistant(d.entity.name)) {
									zuordnung += d.entity.name + '&nbsp;';
								}
							}
							zuordnung += '</a><br/>';

							_e += zuordnung;
							d.data.forEach(function (da) {
								if (da.value.year != null) {
									_e += da.value.year + ' ';
								}
								if (da.value.position != null) {
									_e += da.value.position + ' ';
								}
								if (da.value.activity != null) {
									_e += da.value.activity + ' ';
								}
								_e += da.value.periodical + ' Stufe: ' + formatStagesAddIncome(da.value.level) + '<br>';
							})
						});

						if (_a.length != 0) {
							_a = '<br /><h5>Berufliche Tätigkeit vor der Mitgliedschaft im Deutschen Bundestag</h5>' + _a;
						}
						if (_b.length != 0) {
							_b = '<br /><h5>Funktionen in Vereinen, Verbänden und Stiftungen</h5>' + _b;
						}
						if (_c.length != 0) {
							_c = '<br /><h5>Funktionen in Unternehmen</h5>' + _c;
						}
						if (_d.length != 0) {
							_d = '<br /><h5>Funktionen in Körperschaften und Anstalten des öffentlichen Rechts</h5>' + _d;
						}
						if (_e.length != 0) {
							_e = '<br /><h5>Entgeltliche Tätigkeiten neben dem Mandat</h5>' + _e;
						}
						if (_f.length != 0) {
							_f = '<br /><h5>Beteiligungen an Kapital- oder Personengesellschaften</h5>' + _f;
						}
						if (_g.length != 0) {
							_g = '<br /><h5>Vereinbarungen über künftige Tätigkeiten oder Vermögensvorteile</h5>' + _g;
						}
						$content = $content + _a + _b + _c + _d + _e + _f + _g;
						$content += '</div>';
						$content += '</div>';
					}
				}


				if (hasLinks) {
					console.log('Entity has Links');
					$content += '<div class="row row-results">';
					$content += '<div class="col-md-12"><h4>Links</h4></div>';

					$(entity.data).each(function (idx, data) {
						if (data.key == 'link') {
							$content += '<div class="col-md-12">';
							$content += '<div class="entity-link"><i class="fa fa-external-link"></i> <a title="' + data.value.url + '" target="_blank" href="' + data.value.url + '">' + data.value.url + '</a></div>';
							$content += '</div>';
						}
					});
					$content += '</div>';
				}

				if (hasSource) {
					console.log('Entity has Source');
					$content += '<div class="row row-results">';
					$content += '<div class="col-md-12"><h4>Quellen</h4></div>';

					$(entity.data).each(function (idx, data) {
						if (data.desc == 'Quelle') {
							$content += '<div class="col-md-12">';
							$content += '<div class="entity-source">';
							if (data.value.url !== undefined) {
								$content += '<i class="fa fa-bookmark"></i> <a title="' + data.value.url + '" target="_blank" href="' + data.value.url + '">';
								$content += data.value.url;
								$content += '</a>';
							}
							$content += '</div>';
							$content += '</div>';
						}
					});
					$content += '</div>';

				}

				$content += '<div class="row"><br/>';
				$content += '<div class="col-sm-6">';
				$content += '<a class="btn btn-block btn-default" href="mailto:lobbyradar@zdf.de?subject=Verbindung melden ';
				$content += entity.name;
				$content += ' (';
				$content += entity._id;
				$content += ')&body=Ich möchte eine Verbindung melden:" role="button">Verbindung melden</a>';
				$content += '</div>';
				$content += '<div class="col-sm-6">';
				$content += '<a class="btn btn-block btn-default" href="mailto:lobbyradar@zdf.de?subject=Fehler melden ';
				$content += entity.name;
				$content += ' (';
				$content += entity._id;
				$content += ')&body=Ich möchte einen Fehler melden:" role="button">Fehler melden</a>';
				$content += '</div>';
				$content += '</div>';

				$content += '<div class="row"><br/>';
				$content += '<div class="col-sm-12">';
				$content += '<p class="meta">';
				$content += '<span>Erstellt: ' + moment(entity.created).format("DD.MM.YYYY hh:mm") + '</span><br/>';
				$content += '<span>Aktualisiert: ' + moment(entity.created).format("DD.MM.YYYY hh:mm") + '</span>';
				$content += '</p>';
				$content += '</div>';
				$content += '</div>';


			}
			$content += '</div>';
			// clear current view
			$(".result-single .content .entity", "#main").remove();
			$(".result-single .content ", "#main").append($content);
			// reset request
			req = null;
			$(document).trigger('load_entity_complete');
			$(".result-single").delay(400).slideDown("slow");

		});
	}

	function getMonthName(month) {
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

	}

	function formatStagesAddIncome(val) {
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
	}
	$('body').on('click', 'button.close', function (e) {
		$(".result-single").slideUp("slow");
		$(".result-list").slideUp("slow");
		e.preventDefault();
		trans_x = 0;
		trans_y = 0;
		g.transition()
			.attr('transform', 'translate('+trans_x+', '+trans_y+')')
			.duration(2000);
	});
	$('body').on('click', '#backtolist', function (e) {
		$(".result-single").slideUp("slow");
		$(".result-list").slideUp("slow");
		e.preventDefault();
	});
})
