/**
 * Created by Letty on 20/04/15.
 */

$(document).ready(function () {

	d3.selection.prototype.moveToFront = function () {
		return this.each(function () {
			this.parentNode.appendChild(this);
		});
	};

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
		//console.log(data);

		var tooltip = d3.select("#rel_viz")
			.append("div")
			.attr("class", "overdings")
			.attr("id", "tip")
			.style("position", "absolute")
			.style("z-index", "10")
			.style("visibility", "hidden");

		function rad(v) { return 30*Math.sqrt(v) };

		console.log(rad);

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
		var w = $('#rel_viz').innerWidth(),
			h = $('#rel_viz').innerHeight() - 130;

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

		var link = svg.selectAll(".link")
			.data(force.links())
			.enter().append("line")
			.attr("class", "link")
			.style('fill', 'none')
			.style('stroke', 'rgb(20,59,82)')
			.style('stroke-width', '1.5px');

		var node = svg.selectAll(".node")
			.data(force.nodes())
			.enter().append("circle")
			.attr("class", "node")
			.on("mouseover", function (d) {
				//console.log('x: '+x+' y: '+y);
				var x = parseFloat(this.getAttribute('cx'));
				var y = parseFloat(this.getAttribute('cy'));
				var r = parseFloat(this.getAttribute('r'));
				return tooltip.style("visibility", "visible")
					.style("top", (y) + "px")
					.style("left", (x+r) + "px")
					.text(d.name);
			})
			.on("mouseout", function (d) {
				return tooltip.style("visibility", "hidden");
			})
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


		console.log('min: ' + min + ' max: ' + max);

		console.log(d3.selectAll('circle')[0].length);

		d3.selectAll('circle')
			.attr('r', function (d) {
				return rad(d.weight);
			});

		var scale = 1;
		//radius abschätzen der gesammte viz indem ich durch die nodes
		// resize event und tickfkt aufrufen
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
			console.log(this);
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
})