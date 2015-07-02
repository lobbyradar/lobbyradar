var fs = require('fs');
var path = require('path');

var nodeFile = path.resolve(__dirname, '../nodes.json');
var linkFile = path.resolve(__dirname, '../links.json');
var positionFile = path.resolve(__dirname, '../positions.json');

console.log('   load nodes');
var nodes = JSON.parse(fs.readFileSync(nodeFile, 'utf8'));

console.log('   load links');
var links = JSON.parse(fs.readFileSync(linkFile, 'utf8'));

var nodeLookup = {};

console.log('   prepare nodes');
nodes = nodes.map(function (node) {
	var newNode = {
		name:             node.name,
		id:               node._id,
		type:             node.type,
		mdb:              node.mdb,
		size:             node.connections,
		r:      Math.sqrt(node.connections)*2,
		charge:        -4*node.connections-6,
		neighbours:       []
	}

	nodeLookup[node._id] = newNode;

	return newNode;
})

console.log('   sort nodes');
nodes.sort(function (a,b) { return (a.id < b.id) ? -1 : 1 })

if (fs.existsSync(positionFile)) {
	console.log('   load positions');
	var positions = JSON.parse(fs.readFileSync(positionFile, 'utf8'));
	positions.forEach(function (position) {
		var node = nodeLookup[position.i];
		if (node === undefined) return;
		node.x = position.x;
		node.y = position.y;
	})
}

// fill position for new nodes

nodes.forEach(function (node) {
	if (node.x === undefined) {
		var x = 0;
		var y = 0;
		var n = 1e-10;
		node.neighbours.forEach(function (neighbour) {
			if (neighbour.x === undefined) return;
			x += neighbour.x;
			y += neighbour.y;
			n++;
		})
		node.x = x / n + (Math.random()-0.5);
		node.y = y / n + (Math.random()-0.5);
	}
})

console.log('   prepare links');
links = links.map(function (link) {
	var link = {
		source: nodeLookup[link.entities[0]],
		target: nodeLookup[link.entities[1]]
	}
	
	link.source.neighbours.push(link.target);
	link.target.neighbours.push(link.source);

	return link;
})

console.log('data import finished');

module.exports = {
	nodes: nodes,
	links: links,
	config: {
		scale: 0.95
	}
}