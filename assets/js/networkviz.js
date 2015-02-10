var NetworkViz = (function () {

	var f = 32768;

	var nodeLookup = {};
	var nodeList = [];

	var initialized = false;
	var map, labelLayer;

	var hoveredNodes = [];
	var activeNodes = [];

	var clickHandler = false;

	function init() {
		if (!node_positions) return console.error('node_positions.js not loaded ... yet')

		initialized = true;

		var keys = Object.keys(node_positions);
		var n = node_positions[keys[0]].length;
		for (var i = 0; i < n; i++) {
			var node = {};
			keys.forEach(function (key) {
				node[key] = node_positions[key][i];
			})
			node.x += f/2;
			node.y += f/2;
			nodeLookup[node.id] = node;
			nodeList.push(node);
		}

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
			zoom: 5,
			center: [-0.5*f,0.5*f],
			maxBounds: L.latLngBounds([-f,0],[0,f]),
			crs: crs,
			zoomAnimation: true,
			zoomControl:false,
			scrollWheelZoom:true
		});
		map.addControl( L.control.zoom({position: 'bottomleft'}) )


		map.on('mousemove', mousemove);
		map.on('click', mouseclick);

		var layer = L.tileLayer('http://lobbyradar.opendatacloud.de/lobbynetwork/tiles/{z}/{y}/{x}.png', {
			minZoom: 0,
			maxZoom: 7,
			maxNativeZoom: 7,
			tileSize: 256,
			zoomOffset: 0,
			// attribution: '<a href="https://events.ccc.de/congress/2013/">31C3</a> | Improve the code on <a href="https://github.com/OpenDataCity/31c3-map">GitHub</a>!',
			attribution: '',
			noWrap: true
		})
		
		layer.addTo(map);

		labelLayer = L.layerGroup();
		labelLayer.addTo(map);
	}

	function mousemove(e) {
		var point = e.latlng;

		hoveredNodes.forEach(function (node) {
			if (!node.active) hideLabel(node);
			$('#networkviz').css( 'cursor', '-webkit-grab' );

		})
		hoveredNodes = [];

		nodeList.forEach(function (node) {
			var d = Math.sqrt(sqr(node.x - point.lng) + sqr(node.y + point.lat));
			if (d < node.r) {
				hoveredNodes.push(node);
				showLabel(node);
				$('#networkviz').css( 'cursor', 'pointer' );

			};
		})
	}

	function mouseclick(e) {
		if (!clickHandler) return;

		var point = e.latlng;
		var bestNode = false;
		var bestDist = 1e10;

		nodeList.forEach(function (node) {
			var d = Math.sqrt(sqr(node.x - point.lng) + sqr(node.y + point.lat));
			if ((d < node.r) && (d < bestDist)) {
				bestDist = d;
				bestNode = node;
			};
		});

		if (bestNode) {
			console.debug();
			clickHandler(bestNode.id);
			e.originalEvent.preventDefault();
		}
	}

	function panToNode(node) {
		var zoom = Math.round(13 - Math.log(node.r)/Math.log(2));

		if (zoom < 0) zoom = 0;
		if (zoom > 7) zoom = 7;

		var latLng = L.latLng(-node.y, node.x);
		var centerPoint = map.getSize();
		latLng.lng += centerPoint.x*Math.pow(0.5, zoom-5);

		map.setView(latLng, zoom, {animate:true})
	}

	function clearNodes() {
		activeNodes.forEach(function (node) {
			node.active = false;
			hideLabel(node);

		})
	}

	function ensureLabel(node) {
		if (node.label) return;
		var latLng = L.latLng(-node.y, node.x);
		node.label = L.label(latLng, {text:node.name, color: (node.type == 'person') ? '#fa7d18' : '#a3db19' });
		node.label.addTo(labelLayer);
	}

	function showLabel(node) {
		ensureLabel(node);
		node.label.show();
	}

	function hideLabel(node) {
		node.label.hide();
	}

	function activateNode(node) {
		node.active = true;
		activeNodes.push(node);
		showLabel(node);
	}

	function highlightNode(node) {
		clearNodes();
		activateNode(node);
		panToNode(node);
	}

	function setClickHandler(func) {
		clickHandler = func;
	}

	function activateNodeId(id) {
		if (!initialized) init();
		var node = nodeLookup[id];
		if (!node) return console.log('id not found "'+id+'"');

		activateNode(node);
	}

	function highlightNodeId(id) {
		if (!initialized) init();
		var node = nodeLookup[id];
		if (!node) return console.log('id not found "'+id+'"');

		highlightNode(node);
	}

	function panToNodeId(id) {
		if (!initialized) init();
		var node = nodeLookup[id];
		if (!node) return console.log('id not found "'+id+'"');

		panToNode(node);
	}

	return {
		highlightEntity: highlightNodeId,
		panToEntity: panToNodeId,
		setClickHandler: setClickHandler
	}

	function sqr(v) {
		return v*v;
	}
})();

L.Label = L.Class.extend({

	includes: L.Mixin.Events,

	options: {
		text: 'text'
	},

	label: false,

	initialize: function (latlng, options) {
		L.setOptions(this, options);
		this._latlng = L.latLng(latlng);
	},

	_initLabel: function () {
		this.label = $('<div class="leaflet-label"></div>');
		this.label.text(this.options.text);
		if (this.options.text.length > 30) this.label.addClass('small');
		// if (this.options.color) {
		// 	this.label.css('text-shadow', '0px 0px 2px '+this.options.color);
		// }

		var panes = this._map._panes;

		$(panes.markerPane).append(this.label);
	},

	update: function () {
		if (this.label) {
			var pos = this._map.latLngToLayerPoint(this._latlng).round();
			this.label.css({
				left:pos.x - this.label.width()/1.8,
				top: pos.y + 20
			});
		}

		return this;
	},

	onAdd: function (map) {
		this._map = map;

		map.on('viewreset', this.update, this);

		this._initLabel();
		this.update();
		this.fire('add');

		if (map.options.zoomAnimation && map.options.markerZoomAnimation) {
			map.on('zoomanim', this._animateZoom, this);
		}
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	show: function () {
		this.label.removeClass('hidden');
	},

	hide: function () {
		this.label.addClass('hidden');
	}
});

L.label = function (latlng, options) {
	return new L.Label(latlng, options);
};
