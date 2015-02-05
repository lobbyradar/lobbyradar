var NetworkViz = (function () {

	var f = 32768;

	var positions = {};
	var initialized = false;
	var map, labelLayer;

	function init() {
		initialized = true;

		var keys = Object.keys(node_positions);
		var n = node_positions[keys[0]].length;
		for (var i = 0; i < n; i++) {
			var entry = {};
			keys.forEach(function (key) {
				entry[key] = node_positions[key][i];
			})
			entry.x += f/2;
			entry.y += f/2;
			positions[entry.id] = entry;
		}
		node_positions = positions;

		var projection = {
			project: function (latlng) {
				return L.point(latlng.lng/f, -latlng.lat/f);
			},
			unproject: function (point) {
				return L.latLng(-point.y*f, point.x*f);
			}
		};

		var crs = L.extend({}, L.CRS, {
			projection: projection,
			transformation: new L.Transformation(1, 0, 1, 0),
			scale: function (zoom) {
				return 256*Math.pow(2, zoom);
			}
		});

		$('#networkviz').css({height:'100%'});

		map = L.map('networkviz', {
			minZoom: 0,
			maxZoom: 7,
			zoom: 3,
			center: [-0.5*f,0.5*f],
			maxBounds: L.latLngBounds([-f,0],[0,f]),
			crs: crs,
			zoomAnimation: false
		});

		var layer = L.tileLayer('http://lobbyradar.opendatacloud.de/lobbynetwork/tiles/{z}/{y}/{x}.png', {
			minZoom: 0,
			maxZoom: 7,
			maxNativeZoom: 7,
			tileSize: 256,
			zoomOffset: 0,
			attribution: '<a href="https://events.ccc.de/congress/2013/">31C3</a> | Improve the code on <a href="https://github.com/OpenDataCity/31c3-map">GitHub</a>!',
			noWrap: true
		})
		
		layer.addTo(map);

		labelLayer = L.layerGroup();
		labelLayer.addTo(map);
	}
	/*

		setTimeout(function () {
			//showEntity('54bd3c8d8b934da063412627') // Axel Voss
			showEntity('54bd3c748b934da06340f4c4') // CSU
		}, 1000);
*/

	function panToEntity(id) {
		if (!initialized) init();
		if (!node_positions[id]) {
			console.log('id not found "'+id+'"')
			return;
		}

		var node = node_positions[id];
		var zoom = Math.round(13 - Math.log(node.r)/Math.log(2));

		var centerPoint = map.getSize();

		var latLng = L.latLng(-node.y, node.x);
		var centerPoint = map.getSize();
		latLng = map.project(latLng, zoom);
		latLng.x += centerPoint.x/4;
		latLng = map.unproject(latLng, zoom);

		map.setView(latLng, zoom, {animate:true})
	}

	return {
		panToEntity: panToEntity
	}
})()