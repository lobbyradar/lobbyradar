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
	})

	var result = {};
	Object.keys(positions[0]).forEach(function (key) {
		result[key] = positions.map(function (entry) { return entry[key] });
	});

	result = 'var node_positions = '+JSON.stringify(result)+';';
	fs.writeFileSync('./node_positions.js', result, 'utf8');
}