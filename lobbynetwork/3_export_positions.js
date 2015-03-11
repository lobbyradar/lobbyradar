var fs = require('fs');

var data = require('./lib/prepare_data.js');

var nodes = data.nodes;
var links = data.links;

exportPositions();

function exportPositions() {
	console.log('export positions');
	
	var positions = nodes.map(function (node) {
		return {
			id: node.id,
			name: node.name,
			type: node.type,
			r: Math.round(node.r*4),
			x: Math.round(node.x*4),
			y: Math.round(node.y*4)
		}
	});

	positions.sort(function (a,b) {
		return (a.id < b.id) ? -1 : 1;
	});

	console.log('   prepare id lookup');
	var lookup = {};
	positions.forEach(function (node, index) {
		lookup[node.id] = index;
	})

	console.log('   generate edges');
	var edges = [];
	links.forEach(function (link) {
		var i1 = lookup[link.source.id];
		var i2 = lookup[link.target.id];
		if (i1 === undefined) return;
		if (i2 === undefined) return;

		edges.push((i1 < i2) ? [i1,i2] : [i2,i1]);
	})

	console.log('   sort edges');
	edges.sort(function (a,b) {
		if (a[0] != b[0]) return a[0] - b[0];
		return a[1] - b[1];
	})
	
	console.log('   remove duplicated edges');
	var lastHash = '';
	edges = edges.filter(function (edge) {
		var hash = edge.join('_');
		if (hash == lastHash) return false;
		lastHash = hash;
		return true;
	})

	var result = {nodes:{},edges:edges};
	Object.keys(positions[0]).forEach(function (key) {
		result[key] = positions.map(function (entry) { return entry[key] });
	});

	result = 'var node_positions = '+JSON.stringify(result)+';';
	fs.writeFileSync('./node_positions.js', result, 'utf8');
}