var imageSize = 8192;
var scale = 1;

var fs = require('fs');
var d3 = require('d3');
var gm = require('gm');
var im = gm.subClass({ imageMagick: true });

var nodes = JSON.parse(fs.readFileSync('nodes.json', 'utf8')).result;
var links = JSON.parse(fs.readFileSync('links.json', 'utf8')).result;

var nodeLookup = {};
var biggestNode = {size:0};

nodes = nodes.map(function (node) {
	var newNode = {
		name:                node.name,
		id:                  node._id,
		type:                node.type,
		size:                node.connections,
		r:         Math.sqrt(node.connections)*2,
		charge:           -4*node.connections - 6
	}

	nodeLookup[node._id] = newNode;

	if (newNode.size > biggestNode.size) biggestNode = newNode;

	return newNode;
})

if (fs.existsSync('positions.json')) {
	var positions = JSON.parse(fs.readFileSync('positions.json', 'utf8'));
	positions.forEach(function (position) {
		var node = nodeLookup[position.i];
		node.x = position.x;
		node.y = position.y;
	})
}

biggestNode.x = 0;
biggestNode.y = 0;
biggestNode.fixed = true;

links = links.map(function (link) {
	return {
		source: nodeLookup[link.entities[0]],
		target: nodeLookup[link.entities[1]]
	}
})

var interation = 0;

var force = d3.layout.force()
	.nodes(nodes)
	.links(links)
	.linkStrength(0.1)
	.friction(0.9)
	.distance(30)
	.charge(function (node) { return node.charge })
	.gravity(0.02)
	.theta(0.8)
	.alpha(0.1)

force.on('tick', function () {
	interation++;
	console.log(interation)
	force.alpha(0.1);
	if (interation % 1 == 0) {
		finalize();
		writePNG(interation+'.png');
		force.stop();
	}
})

force.on('end', finalize)

force.start();


function finalize() {
	//return
	console.log('write positions');
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

function writePNG(filename) {
	console.log('write "'+filename+'"');

	var size = imageSize/scale;
	var cx = size/2;
	var cy = size/2;

	var strokeOpacity = 0.7;
	var strokeWidth = (0.5/scale);
	if (strokeWidth < 1) {
		strokeOpacity *= strokeWidth;
		strokeWidth = 1;
	}

	var commands = [
		'push graphic-context',
		'viewbox 0 0 '+size+' '+size,
			'push graphic-context',
				'fill white',
				'rectangle 0 0 '+size+' '+size,
			'pop graphic-context',
			'push graphic-context',
				'stroke "rgb(20,59,82)"',
				'fill none',
				'stroke-opacity '+strokeOpacity,
				'stroke-width '+strokeWidth,
				'stroke-antialias 1',
				links.map(line).join('\n'),
			'pop graphic-context',
			'push graphic-context',
				'fill "#fa7d18"',
				nodes.filter(function (n) { return n.type == 'person' }).map(circle).join('\n'),
			'pop graphic-context',
			'push graphic-context',
				'fill "#a3db19"',
				nodes.filter(function (n) { return n.type != 'person' }).map(circle).join('\n'),
			'pop graphic-context',
		'pop graphic-context'
	].join('\n');

	//console.log(commands);


	function circle(node) {
		return 'circle ' + [
			(node.x)/scale + cx,
			(node.y)/scale + cy,
			(node.x + node.r)/scale + cx,
			(node.y)/scale + cy
		].join(',');
	}


	function line(link) {
		var n1 = link.source;
		var n2 = link.target;
		return 'line ' + [
			n1.x/scale + cx,
			n1.y/scale + cy,
			n2.x/scale + cx,
			n2.y/scale + cy
		].join(',');
	}

	
	var t = gm(new Buffer(commands));
	
	t.addSrcFormatter(function (a) {
		a.forEach(function (e,i) { a[i] = 'MVG:'+e });
	});
	t.in('-size');
	t.in(size+'x'+size);
	t.in('-depth');
	t.in('16');

	t.write(filename, function (err) {
		if (err) {
			console.error(err);
		} else {
			console.log(filename);
		}
	});
}

