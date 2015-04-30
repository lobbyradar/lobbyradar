var maxIterations = 2000;
var graphScale = 0.96;

var fs = require('fs');
var d3 = require('d3');

var data = require('./lib/prepare_data.js');

console.log('Prepare Layout');

var nodes = data.nodes;
var links = data.links;

if (process.argv[2]) maxIterations = parseInt(process.argv[2], 10);

links.forEach(function (link, index) {
	if (link.source === undefined) {
		console.log(link, index)
		process.exit();
	}
})

// Find biggest Node

var centerNode = {size:0};

nodes.forEach(function (node) {
	if (node.id == '552ff9ceaf9ee96e1c1df7c9') centerNode = node;
})

centerNode.x = 0;
centerNode.y = 0;
centerNode.fixed = true;

// Prepare layout

var interation = 0;

var force = d3.layout.force()
	.nodes(nodes)
	.links(links)
	.linkStrength(0.2)
	.friction(0.9)
	.distance(50*graphScale)
	.charge(function (node) { return node.charge })
	.gravity(0.02/graphScale)
	.theta(0.5)
	.alpha(0.1)

force.on('tick', function () {
	interation++;

	var alpha = 0.1 * Math.pow(0.05, interation/maxIterations);
	force.alpha(alpha);

	if (interation >= maxIterations) {
		force.stop();
		savePositions();
		return
	}

	if (interation % 100 == 0) {
		console.log((100*interation/maxIterations).toFixed(1)+'%');
		savePositions();
	}
})

console.log('Start Layout');
force.start();

function savePositions() {
	//console.log('write positions');
	var positions = nodes.map(function (node) {
		return {
			i: node.id,
			n: node.name,
			t: node.type,
			r: node.r,
			x: node.x,
			y: node.y
		}
	})
	positions = JSON.stringify(positions, null, '\t');
	fs.writeFileSync('positions.json', positions, 'utf8');
}