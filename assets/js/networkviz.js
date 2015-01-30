$(function () {
	var width = 3000; 
	var height = 3000; 
	var linkLength = 280;

	var container = $('#networkviz');
	if (container.length < 1) return;

	var network = networkviz_api.getNetwork('54c2a4b4fe6a42c82bbaafac', 2);
	network.center.fixed = false;
	network.center.x = width/2;
	network.center.y = height/2;

	var force = d3.layout.force()
	    .size([width, height])
	    .on('tick', tick)
	    .on('end', end);

	$('#networkviz').css({
		width:width,
		height:height
	})

	var svg = d3.select('#networkviz').append('svg')
		.attr('width', width)
		.attr('height', height);

	var links = svg.selectAll('.link'),
	    nodes = svg.selectAll('.node');
	
	force
		.nodes(network.nodes)
		.links(network.links)
		.linkDistance(linkLength)
		.linkStrength(0.4)
		.gravity(1)
		.alpha(0.001)
		.theta(0.8);

	links = links.data(network.links)
		.enter().append('line')
		.style('stroke', 'rgba(20,59,82,0.7)')

	nodes = nodes.data(network.nodes)
		.enter().append('circle')
		.style('fill', function (d) { return d.color })
		.attr('r', function (d) {
			return d.radius/3
		});

	force.start();
	//for (var i = 0; i < 30; i++) force.tick();
	//force.stop();

	var frameCount = 0;
	var startTime = (new Date()).getTime();

	var interval = setInterval(function () {
		nodes
			.transition()
			.duration(200)
			.attr('cx', function(d) { return d.x; })
			.attr('cy', function(d) { return d.y; });
	}, 1000);

	function tick() {
		frameCount++;
		if (frameCount % 2 == 0) {
			var time = (new Date()).getTime();
			console.log(frameCount*1000/(time-startTime));
		}

		var strength = 0.3/force.alpha();
		strength = strength/200;

		network.nodes.forEach(function (node) {
			node.x -= width/2;
			node.y -= height/2;
			var r = Math.sqrt(sqr(node.x) + sqr(node.y));
				var f = (r > 1e-5) ? linkLength*node.depth/r : 1;
			f = Math.pow(f, strength);

			node.x = node.x*f + width/2;
			node.y = node.y*f + height/2;
		})
	}

	function end() {
		clearInterval(interval);

		links
			.attr('x1', function(d) { return d.source.x; })
			.attr('y1', function(d) { return d.source.y; })
			.attr('x2', function(d) { return d.source.x; })
			.attr('y2', function(d) { return d.source.y; })
			.transition()
			.ease('linear')
			.duration(1000)
			.delay(function (d) { return 1000*d.depth })
			.attr('x2', function(d) { return d.target.x; })
			.attr('y2', function(d) { return d.target.y; });
		
		nodes
			.transition()
			.duration(200)
			.attr('cx', function(d) { return d.x; })
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

				var nodeData = networkdata[id];
				if (!nodeData) return;

				nodes[id] = {
					id:id,
					data:nodeData,
					type:nodeData[0],
					depth:i,
					edgesTo:[],
					count:nodeData[2].length
				};
				nodeData[2].forEach(function (newId) {
					newNodeIds.push(newId);
					if (i < depth) addEdge(id, newId, i)
				})
			})
			nodeIds = newNodeIds;
		}


		Object.keys(edges).forEach(function (key) {
			var edge = edges[key];
			nodes[edge.source].edgesTo.push(edge.target);
			nodes[edge.target].edgesTo.push(edge.source);
		})

		var mergeTo = {};
		Object.keys(nodes).forEach(function (key) {
			var node = nodes[key];

			/*
			if ((node.edgesTo.length == 1) && (node.depth >= depth)) {
				var edgeToId = node.edgesTo[0];
				removeEdge(edgeToId, node.id);
				delete nodes[key];
				return;
			}*/

			if ((node.edgesTo.length == 1) && (node.depth >= depth)) {
				var edgeToId = node.edgesTo[0];
				var edgeToKey = edgeToId;

				if (mergeTo[edgeToKey]) {
					mergeTo[edgeToKey].node.count += node.count;
					removeEdge(edgeToId, node.id);
					delete nodes[key];
				} else {
					mergeTo[edgeToKey] = { node:node };
					delete node.data;
				}
				return
			}
		})

		var colors = {
			'person':'#fa7d18',
			'entity':'#a3db19',
		};
		return {
			center: nodes[id],
			nodes: Object.keys(nodes).map(function (key, index) {
				var node = nodes[key];

				node.index = index;
				// node.radius = Math.sqrt(node.count);
				node.radius = 20; //ff

				var color = colors[node.type];
				if (color === undefined) console.log(node.type)
				node.color = color;
				
				return node
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
			if (id1 > id2) {
				var key = id2+'_'+id1;
			} else {
				var key = id1+'_'+id2;
			}

			if (!edges[key]) {
				var edge = {
					source:id1,
					target:id2,
					depth:depth
				}
				edges[key] = edge;
			};
		}

		function removeEdge(id1, id2) {
			if (id1 > id2) {
				var temp = id1; id1 = id2; id2 = temp;
			}

			var key = id1+'_'+id2;
			
			delete edges[key];
		}

	}

	return {
		getNetwork: getNetwork
	}
})();

function sqr(v) {
	return v*v;
}
