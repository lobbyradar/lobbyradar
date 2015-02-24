var fs = require('fs');
var path = require('path');
var async = require('async');
var mongojs = require('mongojs');

// load config
var config = require(path.resolve(__dirname, '../config.js'));

// load mongojs 
var db = mongojs(config.db, [
	'entities',
	'relations'
]);

var nodes, nodeLookup, links;

var queue = async.queue(function (task, next) {
	task(next)
},1)

queue.push(function (callback) {
	console.log('Entities: Loading');
	db.collection('entities').find(function(err, result) {
		console.log('Entities: Analysing');
		if (err) console.error('Entities: Error retrieving collection');

		nodeLookup = {};

		nodes = result.map(function (entry) {
			var node = {
				_id: entry._id,
				name: entry.name,
				type: entry.type,
				connections: 0
			}
			nodeLookup[node._id] = node;
			return node;
		})

		callback();
	});
})

queue.push(function (callback) {
	console.log('Relations: Loading');
	db.collection('relations').find(function(err, result) {
		console.log('Relations: Analysing');
		if (err) console.error('Relations: Error retrieving collection');
		
		links = [];
		result.forEach(function (entry) {
			var
				node1 = nodeLookup[entry.entities[0]],
				node2 = nodeLookup[entry.entities[1]];

			if (!node1) return;
			if (!node2) return;

			node1.connections++;
			node2.connections++;

			links.push({
				type: entry.type,
				entities: entry.entities
			})
		})
		callback();
	});
})

queue.drain = function() {
	console.log('Entities: Saving');
	fs.writeFileSync('nodes.json', JSON.stringify(nodes, null, '\t'), 'utf8');

	console.log('Relations: Saving');
	fs.writeFileSync('links.json', JSON.stringify(links, null, '\t'), 'utf8');

	console.log('Finished!')

	process.exit();
};