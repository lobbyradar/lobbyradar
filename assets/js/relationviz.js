/**
 * Created by Letty on 20/04/15.
 */

$(document).ready(function () {

	// ruestung, verkehr, pharma, bank, seitenwechsler
	var url = window.location.href; // get the url
	var id = url.split("/")[4]; // extract ID
	if(id == '') id = 'ruestung';
	req = $.getJSON("/api/relation/tagged/"+id, function (data) {
		var links = [];
		var nodes = {};
		console.log(data);

		links = data.result.filter(function (relation) {
			if(!relation.entities[0]) return false;
			if(!relation.entities[1]) return false;
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

		var w = $('#rel_viz')[0].clientWidth,
			h = $('#rel_viz')[0].clientHeight;

		var force = d3.layout.force()
			.nodes(d3.values(nodes))
			.links(links)
			.size([w, h])
			.gravity(0.3)
			.linkDistance(100)
			.charge(-800)
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
			.style('stroke', 'red')
			.style('stroke-width', '1.5px');

		var node = svg.selectAll(".node")
			.data(force.nodes())
			.enter().append("g")
			.attr("class", "node")
			.on("mouseover", mouseover)
			.on("mouseout", mouseout);

		node.append("circle")
			.attr("r", function (d) {
				//return 2 * d.weight;
				return 10;
			})
			.style('fill', function (d) {
				if(d.type == 'person'){
					return '#e39e54';
				}else if(d.type == 'entity'){
					return '#9ed670';
				}
			});

		node.append("text")
			.attr("x", 12)
			.attr("dy", ".35em")
			.text(function(d) { return d.name; })
			.style("display", 'none');

		function tick() {
			link
				.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

			node
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
		}

		function mouseover() {
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