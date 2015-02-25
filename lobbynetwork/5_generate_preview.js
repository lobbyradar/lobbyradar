var imageSize = 8192;

var fs = require('fs');
var path = require('path');
var gm = require('gm');

var data = require('./lib/prepare_data.js');

var nodes = data.nodes;
var links = data.links;

savePreview();

function savePreview() {
	var strokeWidth = 0.5;

	console.log('   Prepare commands');

	var commands = [
		'push graphic-context',
			'viewbox 0 0 '+imageSize+' '+imageSize,
			'push graphic-context',
				'stroke "rgb(20,59,82)"',
				'fill none',
				'stroke-width '+strokeWidth,
				links
					.map(line)
					.filter(function (n) { return n })
					.join('\n'),
			'pop graphic-context',
			'push graphic-context',
				'fill "#fa7d18"',
				nodes
					.filter(function (n) { return n.type == 'person' })
					.map(circle)
					.filter(function (n) { return n })
					.join('\n'),
			'pop graphic-context',
			'push graphic-context',
				'fill "#a3db19"',
				nodes
					.filter(function (n) { return n.type != 'person' })
					.map(circle)
					.filter(function (n) { return n })
					.join('\n'),
			'pop graphic-context',
		'pop graphic-context'
	].join('\n');

	//fs.writeFileSync(filename.replace(/png$/, 'mvg'), commands, 'utf8');

	function circle(node) {
		if (node.x === undefined) return false;

		return 'circle ' + [
			(node.x         ) + imageSize/2,
			(node.y         ) + imageSize/2,
			(node.x + node.r) + imageSize/2,
			(node.y         ) + imageSize/2
		].join(',');
	}

	function line(link) {
		var n1 = link.source;
		var n2 = link.target;

		if (n1.x === undefined) return false;
		if (n2.x === undefined) return false;

		return 'line ' + [
			(n1.x) + imageSize/2,
			(n1.y) + imageSize/2,
			(n2.x) + imageSize/2,
			(n2.y) + imageSize/2
		].join(',');
	}

	console.log('   Prepare gm');
	
	commands = new Buffer(commands);
	fs.writeFileSync('preview.mvg', commands);

	var img = gm(commands);
	
	img.addSrcFormatter(function (a) {
		a.forEach(function (e,i) { a[i] = 'MVG:'+e });
	});
	img.in('-size');
	img.in(imageSize+'x'+imageSize);
	img.in('-background');
	img.in('white');

	console.log('   Prepare rendering');

	img.write('preview.png', function (err) {
		if (err) console.error(err);
	})
}

function sqr(v) {
	return v*v;
}