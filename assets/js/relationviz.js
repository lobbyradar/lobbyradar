/**
 * Created by Letty on 20/04/15.
 */

$(document).ready(function () {

	var links = [];
	var nodes = {};

	req = $.getJSON("api/relation/tagged/ruestung", function (data) {
		//console.log(data);

		data.result.forEach(function (relation) {
			//console.log(relation);

			var obj = {
				source: relation.entities[0]._id,
				s_obj: relation.entities[0],
				target: relation.entities[1]._id,
				t_obj: relation.entities[1]
			};

			links.push(obj);
		});

		// Compute the distinct nodes from the links.
		links.forEach(function(link) {
			link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, obj: link.s_obj});
			link.target = nodes[link.target] || (nodes[link.target] = {name: link.target, obj: link.t_obj});
		});


		var w = $('#rel_viz')[0].clientWidth,
			h = $('#rel_viz')[0].clientHeight;

		var force = d3.layout.force()
			.nodes(d3.values(nodes))
			.links(links)
			.size([w, h])
			.friction(0.5)
			.gravity(0.02)
			.linkDistance(150)
			.charge(-100)
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
				if(d.obj.type=='person'){
					return '#e39e54';
				}else if(d.obj.type == 'entity'){
					return '#9ed670';
				}
			});

		node.append("text")
			.attr("x", 12)
			.attr("dy", ".35em")
			.text(function(d) { return d.obj.name; });

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
			d3.select(this).select("circle").transition()
				.duration(750)
				.attr("r",function (d) {
					return 2.5 * d.weight;
				})
		}

		function mouseout() {
			d3.select(this).select("circle").transition()
				.duration(750)
				.attr("r", function (d) {
					return 2 * d.weight;
				})
		}

	});
})