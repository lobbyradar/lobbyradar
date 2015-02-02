var imageSize = 8192;
var maxIterations = 1;
var tileFolder = './tiles/';
var tileSize = 256;

var fs = require('fs');
var path = require('path');
var d3 = require('d3');
var gm = require('gm');

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

	var alpha = 0.1 * Math.pow(0.05, interation/maxIterations);
	force.alpha(alpha);

	if (interation >= maxIterations) {
		force.stop();
		savePositions();
		saveTiles(8);
		return
	}

	if (interation % 100 == 0) savePositions();
})

force.start();


function savePositions() {
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

function saveTiles(maxDepth) {
	var maxProcesses = 4;

	var activeProcesses = 0;
	var todos = [];

	todos.push(function () {
		render(0,0,0,nodes,links);
	})

	nextTodo();

	function nextTodo() {
		while ((activeProcesses < maxProcesses) && (todos.length > 0)) {
			var todo = todos.shift();
			activeProcesses++;
			setImmediate(todo);
		}
	}

	function finishedTodo() {
		activeProcesses--;
		nextTodo();
	}

	function render(x0, y0, z0, nodes, links) {
		var foldername = path.join(tileFolder, z0+'/'+y0 );
		var filename = foldername+'/'+x0+'.png';

		ensureFolder(foldername);

		if (z0 < maxDepth) {
			prepareSubTile(x0*2+0, y0*2+0, z0+1);
			prepareSubTile(x0*2+1, y0*2+0, z0+1);
			prepareSubTile(x0*2+0, y0*2+1, z0+1);
			prepareSubTile(x0*2+1, y0*2+1, z0+1);
		}

		var scale = imageSize/(tileSize*Math.pow(2,z0));
		var cx = imageSize*(1/2 - x0/Math.pow(2,z0));
		var cy = imageSize*(1/2 - y0/Math.pow(2,z0));

		function prepareSubTile(xn, yn, zn) {
			var radius = 0.8*imageSize/Math.pow(2,zn);
			var radius2 = sqr(radius);
			var cx = imageSize*(-1/2 + (+1/2 + xn)/Math.pow(2,zn));
			var cy = imageSize*(-1/2 + (+1/2 + yn)/Math.pow(2,zn));

			var newNodes = nodes.filter(function (node) {
				return Math.sqrt(sqr(cx-node.x)+sqr(cy-node.y)) < (radius+node.r)
			})

			var newLinks = links.filter(function (link) {
				var n1 = link.source;
				var n2 = link.target;
				lx = (n1.x-n2.x)*a + n2.x;
				ly = (n1.y-n2.y)*a + n2.y;
				var ldx = (n1.x - n2.x);
				var ldy = (n1.y - n2.y);
				var lx0 = (n2.x - cx);
				var ly0 = (n2.y - cy);

				var a = -(lx0*ldx + ly0*ldy)/(ldx*ldx + ldy*ldy);
				if (a < 0) a = 0;
				if (a > 1) a = 1;
				var d2 = sqr(ldx*a + lx0) + sqr(ldy*a + ly0);

				return d2 < radius2;
			});

			todos.push(function () { render(xn, yn, zn, newNodes, newLinks) });
		}

		var strokeOpacity = 0.7;
		var strokeWidth = (0.5/scale);
		if (strokeWidth < 1) {
			strokeOpacity *= strokeWidth;
			strokeWidth = 1;
		}

		var commands = [
			'push graphic-context',
			'viewbox 0 0 '+tileSize+' '+tileSize,
				'push graphic-context',
					'fill white',
					'rectangle 0 0 '+tileSize+' '+tileSize,
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

		function circle(node) {
			return 'circle ' + [
				(node.x + cx         )/scale,
				(node.y + cy         )/scale,
				(node.x + cx + node.r)/scale,
				(node.y + cy         )/scale
			].join(',');
		}


		function line(link) {
			var n1 = link.source;
			var n2 = link.target;
			return 'line ' + [
				(n1.x + cx)/scale,
				(n1.y + cy)/scale,
				(n2.x + cx)/scale,
				(n2.y + cy)/scale
			].join(',');
		}

		
		var t = gm(new Buffer(commands));
		
		t.addSrcFormatter(function (a) {
			a.forEach(function (e,i) { a[i] = 'MVG:'+e });
		});
		t.in('-size');
		t.in(tileSize+'x'+tileSize);
		t.dither(true);
		t.colors(64);

		t.write(filename, function (err) {
			if (err) {
				console.error(err);
			} else {
				console.log(filename);
			}
			finishedTodo();
		});

	}

	function ensureFolder(folder) {
		if (!fs.existsSync(folder)) {
			ensureFolder(path.dirname(folder));
			fs.mkdirSync(folder);
		}
	}

	function sqr(v) {
		return v*v;
	}
}