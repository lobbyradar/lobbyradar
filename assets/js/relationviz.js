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
		.style('visibility', 'hidden');

	// ruestung, verkehr, pharma, bank, seitenwechsler
	var url = window.location.href; // get the url
	var id = url.split("/")[4]; // extract ID
	if (id == '') id = 'ruestung';

	// we change the selected value from the dropdown to current relation
	$("form.theme-switch select").val("/relation/" + id);
	// we inserted an empty option to prevent flickering and now we remove it
	$("form.theme-switch select option[value='']").remove();

	req = $.getJSON("/api/relation/tagged/" + id, function (data) {
		var links = [];
		var nodes = {};

		function rad(v) {
			return 30 * Math.sqrt(v)
		};

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
			.charge(function (node) {
				return -300 * rad(node.weight)
			})
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
					.style("left", (x + r) + "px")
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
			scale = Math.pow(Math.pow(scale, 10) * newScale, 1 / 11);

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
					return Math.min(1, scale * 10);
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
		trans_x = (-w / 4);
		trans_y = 0;
		g.transition()
			.attr('transform', "translate(" + trans_x + ", " + trans_y + ")")
			.duration(2000);
		var x = parseFloat(this.getAttribute('cx')) + trans_x;
		var y = parseFloat(this.getAttribute('cy')) + trans_y;
		var r = parseFloat(this.getAttribute('r'));

		tooltip.style("visibility", "visible")
			.style("top", (y) + "px")
			.style("left", (x + r) + "px")
			.text(d.name);
	};


	// load an entity from ID and build up html
// used in Deeplink and Detail from List
	var req = null;

	function loadEntity2(id) {
		if (req) {
			req.abort();
		}

		$(".leaflet-control-zoom").css("display", 'block');
		$(".result-list").slideUp("slow");
		$('.fullscreen').animate({scrollTop: 0});
		$("#backtolist").css("display", 'inline-block'); // always show the backbutton

		req = $.getJSON("/api/entity/get/" + id, {relations: true}, function (data) {
			req = null;
			var $content = utils.displayEntity(data.result);
			// clear current view
			$(".result-single .content .entity", "#main").remove();
			$(".result-single .content ", "#main").append($content);
			$(document).trigger('load_entity_complete');
			$(".result-single").delay(400).slideDown("slow");

		});
	}


	$('body').on('click', 'button.close', function (e) {
		$(".result-single").slideUp("slow");
		$(".result-list").slideUp("slow");
		e.preventDefault();
		trans_x = 0;
		trans_y = 0;
		g.transition()
			.attr('transform', 'translate(' + trans_x + ', ' + trans_y + ')')
			.duration(2000);
	});
	$('body').on('click', '#backtolist', function (e) {
		$(".result-single").slideUp("slow");
		$(".result-list").slideUp("slow");
		e.preventDefault();
	});
})
