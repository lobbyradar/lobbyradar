$(function () {
	var width = 600;
	var height = 600;

	var container = $('#networkviz');
	if (container.length < 1) return;

	var network = networkviz_api.getNetwork('54c71e94349d25992bca52ed', 2);
	network.center.fixed = true;
	network.center.x = width/2;
	network.center.y = height/2;

	var force = d3.layout.force()
	    .size([width, height])
	    .on('tick', tick);

	$('#networkviz').css({
		width:width,
		height:height
	})

	var svg = d3.select('#networkviz').append('svg')
		.attr('width', width)
		.attr('height', height);

	var link = svg.selectAll('.link'),
	    node = svg.selectAll('.node');
	
	force
		.nodes(network.nodes)
		.links(network.links)
		.linkDistance(function (link) {
			console.log(link.depth);
			return 1*Math.pow(0.5, link.depth)
		})
		.linkStrength(function (link) {
			return 1;
		})
		.gravity(1)
		.friction(0.9)
		.charge(-30)
		.theta(0.8)
		.start();

	link = link.data(network.links)
		.enter().append('line')
		.style('stroke', 'rgba(255,255,255,0.1)')

	node = node.data(network.nodes)
		.enter().append('circle')
		.style('fill', function (d) { return d.data[0] == 'person' ? '#F00' : '#00F' })
		.attr('r', function (d) {
			return (d === network.center) ? 3 : Math.sqrt(d.data[2].length)/3
		});

	function tick() {
		link.attr('x1', function(d) { return d.source.x; })
		    .attr('y1', function(d) { return d.source.y; })
		    .attr('x2', function(d) { return d.target.x; })
		    .attr('y2', function(d) { return d.target.y; });

		node.attr('cx', function(d) { return d.x; })
		    .attr('cy', function(d) { return d.y; });
	}
})


var networkviz_api = (function () {
	function getNetwork(id, depth) {
		var nodes = {};
		var edges = {};
		var nodeIds = [id];

		for (var i = 0; i <= depth; i++) {
			var newNodeIds = [];
			nodeIds.forEach(function (id) {
				if (nodes[id]) return;
				if (!networkdata[id]) return;
				nodes[id] = {
					id:id,
					data:networkdata[id]
				};
				networkdata[id][2].forEach(function (newId) {
					newNodeIds.push(newId);
					if (i < depth) {
						if (newId < id) addEdge(newId, id, i); else addEdge(id, newId, i)
					}
				})
			})
			nodeIds = newNodeIds;
		}

		return {
			center: nodes[id],
			nodes: Object.keys(nodes).map(function (key, index) {
				nodes[key].index = index; return nodes[key]
			}),
			links: Object.keys(edges).map(function (key) {
				var edge = edges[key];
				return {
					source:nodes[edge.source],
					target:nodes[edge.target],
					depth:edge.depth
				}
			})
		}

		function addEdge(id1, id2, depth) {
			var key = id1+'_'+id2;
			if (!edges[key]) edges[key] = {
				source:id1,
				target:id2,
				depth:depth
			};
		}

	}

	return {
		getNetwork: getNetwork
	}
})();