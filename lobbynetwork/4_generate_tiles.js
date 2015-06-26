var imageSize = 8192;
var tileFolder = './tiles/';
var tileSize = 256;
var maxTileLevel = 7;
var antialias = 4;

var fs = require('fs');
var path = require('path');
var gm = require('gm');

var data = require('./lib/prepare_data.js');

var nodes = data.nodes;
var links = data.links;

nodes.forEach(function (node) {
	node.x *= data.config.scale;
	node.y *= data.config.scale;
	node.r *= data.config.scale;
})

if (process.argv[2]) antialias = parseInt(process.argv[2], 10);

saveTiles(maxTileLevel);

function saveTiles(maxDepth) {
	var maxProcesses = 4;
	var emptyImageBuffer;

	var activeProcesses = 0;
	var processes = [];
	var startTime = (new Date()).getTime();
	var tileCount = 0;
	var tileCountMax = Math.floor(Math.pow(4, maxDepth)/0.75);

	createEmptyTile(function () {
		renderTiles(0,0,0,nodes,links);
	});

	function nextProcess(func) {
		if (func) processes.push(func);
		while ((activeProcesses < maxProcesses) && (processes.length > 0)) {
			var process = processes.pop();
			activeProcesses++;
			setImmediate(process);
		}
	}

	function finishProcess() {
		activeProcesses--;
		nextProcess();
	}

	function renderTiles(x0, y0, z0, nodes, links, callback) {

		var foldername = path.join(tileFolder, z0+'/'+y0 );
		var filename = foldername+'/'+x0+'.png';

		ensureFolder(foldername);

		if (z0 < maxDepth) {
			var subTilesFilename = [];
			var subTilesRendered = 0;
			prepareSubTile(x0*2+0, y0*2+0, z0+1, 0);
			prepareSubTile(x0*2+1, y0*2+0, z0+1, 1);
			prepareSubTile(x0*2+0, y0*2+1, z0+1, 2);
			prepareSubTile(x0*2+1, y0*2+1, z0+1, 3);
		} else {
			renderTile(finish);
		}


		function finish() {
			tileCount++;
			if (tileCount % 100 == 0) console.log([
				tileCount,
				(new Date()).getTime() - startTime,
				(100*tileCount/tileCountMax).toFixed(1)+'%'
			].join('\t'));
			if (callback) callback(filename);
		}

		function prepareSubTile(xn, yn, zn, index) {
			var radius = 0.8*imageSize/Math.pow(2,zn);
			var radius2 = sqr(radius);
			var cx = imageSize*(-1/2 + (1/2 + xn)/Math.pow(2,zn));
			var cy = imageSize*(-1/2 + (1/2 + yn)/Math.pow(2,zn));

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

			renderTiles(xn, yn, zn, newNodes, newLinks, function (filename) {
				subTilesRendered++;
				subTilesFilename[index] = filename;
				if (subTilesRendered == 4) {
					mergeTiles(subTilesFilename, finish)
				}
			})
		}

		function renderTile(callback) {
			if ((nodes.length == 0) && (links.length == 0)) {
				fs.writeFileSync(filename, emptyImageBuffer);
				callback();
				return
			}

			var aaTileSize = antialias*tileSize;
			var scale = imageSize/(aaTileSize*Math.pow(2,z0));
			var cx = imageSize*(1/2 - x0/Math.pow(2,z0));
			var cy = imageSize*(1/2 - y0/Math.pow(2,z0));

			var strokeWidth = (0.5/scale)*data.config.scale;

			var commands = [
				'push graphic-context',
					'viewbox 0 0 '+aaTileSize+' '+aaTileSize,
					'push graphic-context',
						'stroke "rgb(20,59,82)"',
						'fill none',
						'stroke-width '+strokeWidth,
						links.map(line).join('\n'),
					'pop graphic-context',
					'push graphic-context',
						'fill "#a3db19"',
						nodes.filter(function (n) { return n.type != 'person' }).map(circle).join('\n'),
					'pop graphic-context',
					'push graphic-context',
						'fill "#fee915"',
						nodes.filter(function (n) { return (n.type == 'person') && !n.mdb }).map(circle).join('\n'),
					'pop graphic-context',
					'push graphic-context',
						'fill "#fa7d18"',
						nodes.filter(function (n) { return (n.type == 'person') && n.mdb }).map(circle).join('\n'),
					'pop graphic-context',
				'pop graphic-context'
			].join('\n');

			//fs.writeFileSync(filename.replace(/png$/, 'mvg'), commands, 'utf8');

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

			nextProcess(function () {
				var img = gm(new Buffer(commands));
				
				img.addSrcFormatter(function (a) {
					a.forEach(function (e,i) { a[i] = 'MVG:'+e });
				});
				img.in('-size');
				img.in((tileSize*antialias)+'x'+(tileSize*antialias));
				img.in('-background');
				img.in('transparent');
				img.in('+antialias');
				img.filter('Box');
				img.resize(tileSize, tileSize);

				img.write(filename, function (err) {
					if (err) {
						console.error(err);
						return
					}
					finishProcess();
					callback()
				})
			})
		}

		function mergeTiles(subTilesFilename, callback) {
			nextProcess(function () {
				var img = gm(tileSize*2, tileSize*2, 'transparent');

				img.out('-page');
				img.out('+0+0');
				img.out(subTilesFilename[0]);
				img.out('-page');
				img.out('+256+0');
				img.out(subTilesFilename[1]);
				img.out('-page');
				img.out('+0+256');
				img.out(subTilesFilename[2]);
				img.out('-page');
				img.out('+256+256');
				img.out(subTilesFilename[3]);
				img.out('-mosaic');
				img.out('-resize');
				img.out('50%');

				img.write(filename, function (err) {
					if (err) {
						console.error(err);
						return
					}
					finishProcess();
					callback()
				})
			})
		}
	}

	function createEmptyTile(callback) {
		var t = gm(tileSize, tileSize, '#ffffffff');
		t.colors(2);
		t.toBuffer('PNG', function (err, buf) {
			if (err) console.error(err);
			emptyImageBuffer = buf;
			callback();
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