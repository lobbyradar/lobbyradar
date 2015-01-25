'use strict';

// ------------------- app -------------------

var app = angular.module('Station', ['ui.router', 'ngTable', 'ngResource', 'ui.bootstrap']);

app.config(function ($stateProvider, $urlRouterProvider) {
	'use strict';

	$urlRouterProvider.otherwise("/login");

	$stateProvider
		.state('start', {
			url: "/start",
			templateUrl: "partials/start.html"
		})
		.state('person', {
			url: "/person/:id",
			templateUrl: "partials/editor.html",
			controller: 'PersonEditCtrl'
		})
		.state('organisation', {
			url: "/organisation/:id",
			templateUrl: "partials/editor.html",
			controller: 'OrganisationEditCtrl'
		})
		.state('persons', {
			url: "/persons",
			templateUrl: "partials/persons.html",
			controller: 'PersonsCtrl'
		})
		.state('organisations', {
			url: "/organisations",
			templateUrl: "partials/organisations.html",
			controller: 'OrganisationsCtrl'
		})
		.state('relations', {
			url: "/relations",
			templateUrl: "partials/relations.html",
			controller: 'RelationsCtrl'
		})
		.state('relation', {
			url: "/relation/:id",
			templateUrl: "partials/relation.html",
			controller: 'RelationEditCtrl'
		})
		.state('fields', {
			url: "/fields",
			templateUrl: "partials/fields.html",
			controller: 'FieldsCtrl'
		})
		.state('field', {
			url: "/field/:id",
			templateUrl: "partials/field.html",
			controller: 'FieldEditCtrl'
		})
		.state('users', {
			url: "/users",
			templateUrl: "partials/users.html",
			controller: 'UsersCtrl'
		})
		.state('user', {
			url: "/user/:id",
			templateUrl: "partials/user.html",
			controller: 'UserEditCtrl'
		})
		.state('login', {
			url: "/login",
			templateUrl: "partials/login.html",
			controller: 'LoginCtrl'
		});
});

// ------------------- factories -------------------

app.factory('organisations', function ($resource) {
	'use strict';
	return $resource('/api/entity/:cmd/:id', {
			type: 'entity'
		}, {
			list: {
				method: 'GET',
				params: {cmd: 'list2'}
			},
			item: {
				method: 'GET',
				params: {cmd: 'get'}
			},
			save: {
				method: 'POST',
				params: {cmd: 'update'}
			},
			create: {
				method: 'POST',
				params: {cmd: 'create'}
			},
			remove: {
				method: 'GET',
				params: {cmd: 'delete'}
			}
		}
	);
});

app.factory('persons', function ($resource) {
	'use strict';
	return $resource('/api/entity/:cmd/:id', {type: 'person'}, {
			list: {
				method: 'GET',
				params: {cmd: 'list2'}
			},
			item: {
				method: 'GET',
				params: {cmd: 'get'}
			},
			save: {
				method: 'POST',
				params: {cmd: 'update'}
			},
			create: {
				method: 'POST',
				params: {cmd: 'create'}
			},
			remove: {
				method: 'GET',
				params: {cmd: 'delete'}
			}
		}
	);
});

app.factory('entities', function ($resource) {
	'use strict';
	return $resource('/api/entity/:cmd/:id', {}, {
			list: {
				method: 'GET',
				params: {cmd: 'list2'}
			},
			item: {
				method: 'GET',
				params: {cmd: 'get'}
			}
		}
	);
});

app.factory('users', function ($resource) {
	'use strict';
	return $resource('/api/users/:cmd/:id', {}, {
			list: {
				method: 'GET',
				params: {cmd: 'list'}
			},
			item: {
				method: 'GET',
				params: {cmd: 'get'}
			},
			save: {
				method: 'POST',
				params: {cmd: 'update'}
			},
			create: {
				method: 'POST',
				params: {cmd: 'create'}
			},
			remove: {
				method: 'GET',
				params: {cmd: 'delete'}
			}
		}
	);
});

app.factory('fields', function ($resource) {
	'use strict';
	return $resource('/api/fields/:cmd/:id', {}, {
			list: {
				method: 'GET',
				params: {cmd: 'list'}
			},
			item: {
				method: 'GET',
				params: {cmd: 'get'}
			},
			save: {
				method: 'POST',
				params: {cmd: 'update'}
			},
			create: {
				method: 'POST',
				params: {cmd: 'create'}
			},
			remove: {
				method: 'GET',
				params: {cmd: 'delete'}
			}
		}
	);
});

app.factory('tags', function ($resource) {
	'use strict';
	return $resource('/api/tags/:cmd', {}, {
			list: {
				method: 'GET',
				params: {cmd: 'list'}
			}
		}
	);
});

app.factory('relations', function ($resource) {
	'use strict';
	return $resource('/api/relation/:cmd/:id', {}, {
			list: {
				method: 'GET',
				params: {cmd: 'list'}
			},
			item: {
				method: 'GET',
				params: {cmd: 'get'}
			},
			save: {
				method: 'POST',
				params: {cmd: 'update'}
			},
			create: {
				method: 'POST',
				params: {cmd: 'create'}
			},
			remove: {
				method: 'GET',
				params: {cmd: 'delete'}
			},
			tags: {
				method: 'GET',
				params: {cmd: 'tags'}
			}
		}
	);
});

app.factory('auth', function ($resource) {
	'use strict';
	return $resource('/:cmd', {}, {
			login: {
				method: 'POST',
				params: {cmd: 'login'}
			},
			logout: {
				method: 'POST',
				params: {cmd: 'logout'}
			},
			loggedIn: {
				method: 'GET',
				params: {cmd: 'user'}
			}
		}
	);
});

// ------------------- main -------------------

app.run(function ($rootScope, $state, auth) {

	$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
		if (toState.name !== 'login') {
			if (!$rootScope.loggedInUser) {
				event.preventDefault();
				auth.loggedIn(function (data) {
					if (data.error) return reportServerError($scope, data.error);
					$rootScope.loggedInUser = data.result;
					$state.go(toState.name, toParams);
				}, function () {
					$rootScope.loggedInUser = null;
					$state.go('login');
				});
			}
		}
	});

});

// ------------------- modals -------------------

var okcancelModalDialog = function ($modal, data, cb) {
	var modalInstance = $modal.open({
		templateUrl: 'partials/ask.html',
		controller: function ($scope, $modalInstance, data) {
			$scope.data = data;
			$scope.ok = function () {
				$modalInstance.close($scope.data);
			};
			$scope.cancel = function () {
				$modalInstance.dismiss('cancel');
			};
		},
		resolve: {
			data: function () {
				return data;
			}
		}
	});

	modalInstance.result.then(function () {
		cb(data);
	}, function () {
//			$log.info('Modal dismissed at: ' + new Date());
	});
};

var editModalDialog = function ($modal, data, templateUrl, cb) {
	var modalInstance = $modal.open({
		templateUrl: templateUrl,
		controller: function ($scope, $modalInstance, data) {

			$scope.data = data;

			$scope.ok = function (form) {
				if ($scope.data.validate) {
					return $scope.data.validate($scope.data, function () {
						$modalInstance.close($scope.data);
					})
				}
				if (!form || form.$valid)
					$modalInstance.close($scope.data);
			};

			$scope.cancel = function () {
				$modalInstance.dismiss('cancel');
			};
		},
		resolve: {
			data: function () {
				return data;
			}
		}
	});

	modalInstance.result.then(function (data) {
		cb(data);
	}, function () {
//			$log.info('Modal dismissed at: ' + new Date());
	});
};

var infoModalDialog = function ($modal, data, templateUrl, cb) {
	var modalInstance = $modal.open({
		templateUrl: templateUrl,
		controller: function ($scope, $modalInstance, data) {

			$scope.data = data;

			$scope.ok = function () {
				$modalInstance.dismiss('cancel');
			};
		},
		resolve: {
			data: function () {
				return data;
			}
		}
	});

	modalInstance.result.then(function (data) {
		cb(data);
	}, function () {
//			$log.info('Modal dismissed at: ' + new Date());
	});
};

var reportServerError = function ($scope, err) {
	console.error(err);
	alert(err);
};

// ------------------- controllers -------------------

app.controller('AppCtrl', function ($rootScope, $scope) {
	'use strict';
	$rootScope.globals = {
		fieldtypes: {
			"string": "Text",
			"tags": "Text-Liste",
			"number": "Zahl",
			"link": "Link",
			"bool": "Ja/Nein-Wert",
			"address": "Adresse"
		}
	};

	//$rootScope.getDispayValues = function (field, entity) {
	//	var v = entity[field.key];
	//	if (v == undefined) return '';
	//	if (field.format == 'strings') return v.join(', ');
	//	else if (field.format == 'tags') return v.join(', ');
	//	else if (field.format == 'bool') return v ? 'ja' : 'nein';
	//	else if (field.format == 'link') return v.url;
	//	else if (field.format == 'number') return v;
	//	else if (field.format == 'address') {
	//		var sl = [];
	//		if (v.name) sl.push(v.name);
	//		if (v.addr) sl.push(v.addr);
	//		if (v.postcode) sl.push(v.postcode);
	//		if (v.city) sl.push(v.city);
	//		if (v.country) sl.push(v.country);
	//		return sl.join('; ');
	//	}
	//	return v;
	//};

	$scope.getDispayValues = function (field, entity) {
		var result = [];
		if (['extras', 'fields'].indexOf(field._type) >= 0) {
			if (entity[field.key] !== undefined) {
				result.push({format: field.format, value: entity[field.key]});
			}
		} else {
			if (entity.data && entity.data.length)
				entity.data.forEach(function (d) {
					if (field.key == d.key) {
						result.push(d);
					}
				})
		}
		return result.map(function (v) {
			if (!v.value) return '';
			if ((v.format == 'strings') || (v.format == 'tags')) return v.value.join(', ');
			else if (v.format == 'bool') return v.value ? 'ja' : 'nein';
			else if (v.format == 'link') return v.value.url;
			else if (v.format == 'number') return v.value;
			else if (v.format == 'address') {
				var sl = [];
				if (v.value) {
					if (v.value.name) sl.push(v.value.name);
					if (v.value.addr) sl.push(v.value.addr);
					if (v.value.postcode) sl.push(v.value.postcode);
					if (v.value.city) sl.push(v.value.city);
					if (v.value.country) sl.push(v.value.country);
				}
				return sl.join('; ');
			}
			return v.value;
		}).join(', ');
	};

});

var typedListCtrl = function ($scope, $resource, $filter, $modal, ngTableParams, api, get_fields) {

	$scope.loading = true;

	var list = [];

	$scope.filter = {
		text: '',
		special: false
	};

	$scope.refilter = function () {
		if (list.length)
			$scope.tableParams.reload();
	};

	$scope.resetFilter = function () {
		$scope.filter.text = '';
		$scope.tableParams.reload();
	};

	$scope.remove = function (o) {
		okcancelModalDialog($modal,
			{
				headline: 'Eintrag löschen?',
				question: 'Soll "' + o.name + '" gelöscht werden?'
			}
			, function () {
				api.remove({id: o._id}, function () {
					list = list.filter(function (oe) {
						return oe != o;
					});
					$scope.refilter();
				}, function (err) {
					console.error(err);
				})
			});
	};

	$scope.toggleSpecialFilter = function () {
		$scope.filter.special = !$scope.filter.special;
		$scope.refilter();
	};

	var getData = function ($defer, params) {

		var orderedData = $scope.filter.text.length == 0 ? list : list.filter(function (o) {
			return (
			((o.name || '').indexOf($scope.filter.text) >= 0) ||
			((o.tags ? o.tags : []).join(',').indexOf($scope.filter.text) >= 0)
			);
		});

		if ($scope.filter.special) {
			orderedData = orderedData.filter(function (o) {
				var names = o.name.split(' ');
				return (names.length <= 1) || (names.length > 2);
			});
		}

		orderedData = params.sorting() ?
			$filter('orderBy')(orderedData, params.orderBy()) :
			orderedData;

		params.total(orderedData.length);
		var current = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
		$defer.resolve(current);
	};

	$scope.tableParams = new ngTableParams(
		{
			page: 1,
			count: 10,
			sorting: {
				name: 'asc'
			}
		},
		{
			total: 0,
			getData: getData
		}
	);
	$scope.$watch("filter.text", $scope.refilter);

	$scope.reload = function () {
		$scope.loading = true;
		api.list(get_fields ? get_fields() : null,
			function (data) {
				if (data.error) return reportServerError($scope, data.error);
				list = data.result;
				$scope.tableParams.reload();
				$scope.loading = false;
			},
			function (err) {
				console.error(err);
			}
		);
	};

	$scope.reload();
};

var entitiesListCtrl = function ($scope, $location, $resource, $filter, $modal, ngTableParams, api, fields, tags) {

	$scope.q = {
		fields: []
	};
	var fixedfields = [
		{name: 'Schlagworte', key: 'tags', format: 'tags', _type: 'fields', visible:true},
		{name: 'Aliase', key: 'aliases', format: 'tags', _type: 'fields', visible:true},
		{name: 'Anzahl Verbindungen', key: 'connections', format: 'number', _type: 'extras'}
	];

	$scope.q.fields.push(fixedfields[1]);
	$scope.q.fields.push(fixedfields[0]);

	fields.list(function (data) {
			if (data.error) return reportServerError($scope, data.error);
			$scope.fields = fixedfields.concat(data.result);
		},
		function (err) {
			console.error(err);
		}
	);

	typedListCtrl($scope, $resource, $filter, $modal, ngTableParams, api, function () {
		var q = {};
		$scope.q.fields.forEach(function (f) {
			var type = f._type || 'keys';
			q[type] = q[type] || [];
			q[type].push(f.key);
		});
		for (var key in q) {
			q[key] = q[key].join(',');
		}
		return q;
	});

	$scope.editData = function (field, e) {
		var result = [];
		api.item({id: e._id}, function (data) {
			if (data.error) return reportServerError($scope, data.error);
			var entity = data.result;
			if (['extras', 'fields'].indexOf(field._type) >= 0) {
				if (entity[field.key] !== undefined) {
					var o = {
						key: field.key,
						desc: field.name,
						format: field.format,
						value: entity[field.key],
						fixed: true
					};
					if (field.key == 'tags') {
						o.typeaheadOptions = {
							minLength: 1,
							highlight: true
						};
						o.dataset = {
							name: 'tags',
							displayKey: "value",
							source: function (q, callback) {
								var matches = [];
								var search = function () {
									var substrRegex = new RegExp(q, 'i');
									$.each(o.tags, function (i, s) {
										if (substrRegex.test(s)) {
											matches.push({value: s});
										}
									});
									callback(matches);
								};
								if (o.tags) return search();
								tags.list({type: 'entities'}, function (data) {
										if (data.error) {
											callback(matches);
											return reportServerError($scope, data.error);
										}
										o.tags = data.result;
										search();
									},
									function (err) {
										callback(matches);
										console.error(err);
									}
								);
							}
						};
					}
					result.push(o);
				}
			} else {
				if (entity.data && entity.data.length)
					entity.data.forEach(function (d) {
						if (field.key == d.key) {
							result.push(d);
						}
					});
				if (result.length == 0) {
					result.push({
						desc: field.name,
						format: field.format,
						key: field.key
					})
				}
			}
			editModalDialog($modal,
				{
					entity: entity,
					fields: angular.copy(result),
					validate: function (data, cb) {
						data.fields.forEach(function (f) {
							if (f.fixed) {
								//update fixed field
								entity[f.key] = f.value;
							} else {
								var i = -1;
								if (f.id) {
									var oldfield = entity.data.filter(function (fe) {
										return fe.id == f.id;
									})[0];
									i = entity.data.indexOf(oldfield);
								}
								if (i >= 0) {
									//update field
									entity.data[i] = f;
								} else {
									//new field
									entity.data.push(f);
								}
							}
						});
						//check deleted fields
						result.forEach(function (f) {
							if (f.id) {
								var datafield = data.fields.filter(function (fe) {
									return fe.id == f.id;
								})[0];
								if (!datafield) {
									var oldfield = entity.data.filter(function (fe) {
										return fe.id == f.id;
									})[0];
									var i = entity.data.indexOf(oldfield);
									if (i >= 0) {
										entity.data.splice(i, 1);
									}
								}
							}
						});
						api.save({id: entity._id}, {ent: entity},
							function (data) {
								if (data.error) return reportServerError($scope, data.error);
								e.data = entity.data;
								e.aliases = entity.aliases;
								e.tags = entity.tags;
								cb();
							},
							function (err) {
								console.error(err);
							}
						);
					},
					removeData: function (d, list) {
						var i = list.indexOf(d);
						if (i >= 0) {
							list.splice(i, 1);
						}
					},
					newField: function (list) {
						list.push({
								desc: field.name,
								format: field.format,
								key: field.key
							}
						);
					}
				},
				'partials/fieldsedit-modal.html'
				, function (data) {
					$scope.refilter();
				});
		}, function (err) {
			console.error(err);
		});
	};

	$scope.toggleField = function (field) {
		if (!field.visible)
			$scope.q.fields.push(field);
		else {
			$scope.q.fields = $scope.q.fields.filter(function (f) {
				return f !== field;
			})
		}
		field.visible = !field.visible;
		//$location.search('fields', $scope.q.fields.map(function (f) {
		//	return f.key;
		//}).join(','));
		$scope.reload();
	};

	$scope.relationsDialog = function (item) {
		api.item({id: item._id, relations: true},
			function (data) {
				if (data.error) return reportServerError($scope, data.error);
				infoModalDialog($modal, {
					item: data.result
				}, 'partials/relations-modal.html', function (data) {
					if (data) {
						alert('ok');
					}
				});
			},
			function (err) {
				console.error(err);
			}
		);

	};

	//var searchObject = $location.search();
	//console.log(searchObject);
};

app.controller('PersonsCtrl', function ($scope, $location, $resource, $filter, $modal, ngTableParams, persons, fields, tags) {
	entitiesListCtrl($scope, $location, $resource, $filter, $modal, ngTableParams, persons, fields, tags);
});

app.controller('OrganisationsCtrl', function ($scope, $location, $resource, $filter, $modal, ngTableParams, organisations, fields, tags) {
	entitiesListCtrl($scope, $location, $resource, $filter, $modal, ngTableParams, organisations, fields, tags);
});

app.controller('FieldsCtrl', function ($scope, $resource, $filter, $modal, ngTableParams, fields) {
	typedListCtrl($scope, $resource, $filter, $modal, ngTableParams, fields);
});

app.controller('UsersCtrl', function ($scope, $resource, $filter, $modal, ngTableParams, users) {
	typedListCtrl($scope, $resource, $filter, $modal, ngTableParams, users);
});

app.controller('TagEdit', function ($scope) {

	$scope.addTagEntry = function (field, a) {
		if ($scope.canAddTagEntry(field, a)) {
			field.value = field.value || [];
			field.value.push(a);
			$scope.edit[field.key] = '';
		}
	};

	$scope.canAddTagEntry = function (field, a) {
		return ((!field.value) || (a && (a.length > 0) && (field.value.indexOf(a) < 0)));
	};

	$scope.removeTagEntry = function (field, a) {
		field.value = field.value || [];
		var i = field.value.indexOf(a);
		if (i >= 0) {
			field.value.splice(i, 1);
		}
	};
});

var typedEditCtrl = function ($scope, $state, $stateParams, api, fields, tags, type, mode) {

	$scope.isNew = ($stateParams.id == 'new');

	$scope.edit = {};

	if ($scope.isNew) {
		$scope.item = {
			aliases: [],
			data: [],
			tags: [],
			type: type
		};
	} else {
		api.item({id: $stateParams.id, relations: true},
			function (data) {
				if (data.error) return reportServerError($scope, data.error);
				$scope.item = data.result;
			},
			function (err) {
				console.error(err);
			}
		);
	}

	fields.list(function (data) {
			if (data.error) return reportServerError($scope, data.error);
			$scope.fields = data.result;
		},
		function (err) {
			console.error(err);
		}
	);

	$scope.tags = [];

	tags.list({type: 'entities'}, function (data) {
			if (data.error) return reportServerError($scope, data.error);
			$scope.tags = data.result;
		},
		function (err) {
			console.error(err);
		}
	);

	//typeahead callbacks
	$scope.typeaheadOptionsTags = {
		minLength: 1,
		highlight: true
	};
	$scope.datasetTags = {
		name: 'tags',
		displayKey: "value",
		source: function (q, callback) {
			var matches, substrRegex;
			matches = [];
			substrRegex = new RegExp(q, 'i');
			$.each($scope.tags, function (i, s) {
				if (substrRegex.test(s)) {
					matches.push({value: s});
				}
			});
			callback(matches);
		}
	};
	var typeaheadenter = function (sender, event, value, daset, clear) {
		if (value.value) value = value.value;
		if (daset.name == 'tags') {
			if ($scope.canAddEntry('tags', value)) {
				$scope.item['tags'].push(value);
				$scope.edit['tags'] = '';
				clear();
			}
		}
	};

	$scope.$on("typeahead:enter", typeaheadenter);
	$scope.$on("typeahead:selected", typeaheadenter);

	$scope.addEntry = function (id, a) {
		if ($scope.canAddEntry(id, a)) {
			$scope.item[id].push(a);
			$scope.edit[id] = '';
		}
	};

	$scope.canAddEntry = function (id, a) {
		return ($scope.item && a && (a.length > 0) && ($scope.item[id].indexOf(a) < 0));
	};

	$scope.removeEntry = function (id, a) {
		var i = $scope.item[id].indexOf(a);
		if (i >= 0) {
			$scope.item[id].splice(i, 1);
		}
	};

	$scope.removeData = function (d) {
		var i = $scope.item.data.indexOf(d);
		if (i >= 0) {
			$scope.item.data.splice(i, 1);
		}
	};

	$scope.addData = function (o) {
		$scope.item.data.push({
			format: o.format,
			key: o.key,
			desc: o.name
		});
	};

	$scope.back = function () {
		$state.go(mode);
	};

	if (!$scope.validate) {
		$scope.validate = function (cb) {
			cb();
		};
	}

	$scope.save = function () {
		$scope.validate(function () {
			api.save({id: $stateParams.id}, {ent: $scope.item},
				function (data) {
					if (data.error) return reportServerError($scope, data.error);
					$scope.back();
				},
				function (err) {
					console.error(err);
				}
			);
		});
	};

	$scope.createnew = function () {
		$scope.validate(function () {
			api.create({ent: $scope.item},
				function (data) {
					if (data.error) return reportServerError($scope, data.error);
					$scope.back();
				},
				function (err) {
					console.error(err);
				}
			);
		});
	};

	$scope.needsInput = function (s) {
		return ((!s) || (s.trim().length == 0));
	};
};

var typedEntityEditCtrl = function ($scope, $state, $stateParams, api, fields, tags, type, mode, modename) {
	$scope.modename = modename;
	$scope.validate = function (cb) {
		$scope.item.auto = false;
		if ($scope.edit.tags && ($scope.edit.tags.length > 0)) {
			$scope.addEntry('tags', $scope.edit.tags);
		}
		cb();
	};
	typedEditCtrl($scope, $state, $stateParams, api, fields, tags, type, mode);
};

app.controller('PersonEditCtrl', function ($scope, $state, $stateParams, persons, fields, tags) {
	typedEntityEditCtrl($scope, $state, $stateParams, persons, fields, tags, 'person', 'persons', 'Person');
});

app.controller('OrganisationEditCtrl', function ($scope, $state, $stateParams, organisations, fields, tags) {
	typedEntityEditCtrl($scope, $state, $stateParams, organisations, fields, tags, 'organisation', 'organisations', 'Organisation');
});

app.controller('LoginCtrl', function ($scope, $state, $stateParams, $resource, $rootScope, auth) {
	$scope.login = {};
	$scope.error = null;

	$scope.loginUser = function () {
		auth.login(
			$scope.login,
			function (data) {
				if (data.error) return reportServerError($scope, data.error);
				$rootScope.loggedInUser = data.result;
				$state.go('start');
			},
			function (err) {
				$rootScope.loggedInUser = null;
				$scope.error = err;
			}
		)
	};
});

var typedSimpleEditCtrl = function ($scope, $state, $stateParams, api, type, mode, modename) {

	$scope.modename = modename;

	$scope.isNew = ($stateParams.id == 'new');

	if (!$scope.validate) {
		$scope.validate = function (cb) {
			cb();
		};
	}

	$scope.createnew = function () {
		$scope.validate(function () {
			var o = {};
			o[type] = $scope[type];
			api.create(o,
				function (data) {
					if (data.error) return reportServerError($scope, data.error);
					$state.go(mode);
				},
				function (err) {
					console.error(err);
				}
			);
		});
	};

	$scope.save = function () {
		$scope.validate(function () {
			var o = {};
			o[type] = $scope[type];
			api.save({id: $stateParams.id}, o,
				function (data) {
					if (data.error) return reportServerError($scope, data.error);
					$state.go(mode);
				},
				function (err) {
					console.error(err);
				}
			);
		});
	};

	$scope.back = function () {
		$state.go(mode);
	};

	if (!$scope.isNew) {
		api.item({id: $stateParams.id},
			function (data) {
				if (data.error) return reportServerError($scope, data.error);
				$scope[type] = data.result;
			},
			function (err) {
				console.error(err);
			}
		);
	}

};

var relationEditCtrl = function ($scope, $state, relations, entities, tags, aftersave) {

	$scope.edit = {
		one_org: {},
		two_org: {}
	};

	$scope.validate = function (cb) {
		$scope.relation.auto = false;
		if ($scope.edit.tags && ($scope.edit.tags.length > 0)) {
			$scope.addEntry('tags', $scope.edit.tags);
		}
		cb();
	};

	$scope.relation = {
		tags: [],
		entities: ['', '']
	};

	$scope.modename = 'Verbindung';

	$scope.createnew = function () {
		$scope.validate(function () {
			var o = {relation: $scope.relation};
			relations.create(o,
				function (data) {
					if (data.error) return reportServerError($scope, data.error);
					$scope.relation._id = data.result;
					aftersave();
				},
				function (err) {
					console.error(err);
				}
			);
		});
	};

	$scope.save = function () {
		$scope.validate(function () {
			var o = {relation: $scope.relation};
			relations.save({id: $scope.relation._id}, o,
				function (data) {
					if (data.error) return reportServerError($scope, data.error);
					aftersave();
				},
				function (err) {
					console.error(err);
				}
			);
		});
	};

	$scope.back = function () {
		$state.go('relations');
	};

	$scope.tags = [];

	tags.list({type: 'relations'},
		function (data) {
			if (data.error) return reportServerError($scope, data.error);
			$scope.tags = data.result;
		},
		function (err) {
			console.error(err);
		}
	);

	$scope.typeaheadOptionsEntities = {
		minLength: 2,
		highlight: true
	};

	var datasetEntity = function (prop) {
		return {
			name: 'entities',
			prop: prop,
			displayKey: "name",
			source: function (q, callback) {
				entities.list({search: q},
					function (data) {
						if (data.error) return reportServerError($scope, data.error);
						callback(data.result);
					}, function (err) {
						console.error(err);
					});
			}
		};
	};

	$scope.datasetEntitiesOne = datasetEntity('one');
	$scope.datasetEntitiesTwo = datasetEntity('two');

	//typeahead callbacks
	$scope.typeaheadOptionsTags = {
		minLength: 1,
		highlight: true
	};
	$scope.datasetTags = {
		name: 'tags',
		displayKey: "value",
		source: function (q, callback) {
			var matches, substrRegex;
			matches = [];
			substrRegex = new RegExp(q, 'i');
			$.each($scope.tags, function (i, s) {
				if (substrRegex.test(s)) {
					matches.push({value: s});
				}
			});
			callback(matches);
		}
	};

	var typeaheadenter = function (sender, event, value, daset, clear) {
		if (daset.name == 'tags') {
			if (value.value) value = value.value;
			if ($scope.canAddEntry('tags', value)) {
				$scope.relation['tags'].push(value);
				$scope.edit['tags'] = '';
				clear();
			}
		} else if ((daset.name == 'entities') && (typeof value !== 'string')) {
			$scope.edit[daset.prop + '_org'].name = value;
			$scope.edit[daset.prop] = value;
			if (!$scope.relation.entities) $scope.relation.entities = [];
			$scope.relation.entities[daset.prop == 'one' ? 0 : 1] = value._id;
		}
	};

	$scope.$on("typeahead:enter", typeaheadenter);
	$scope.$on("typeahead:selected", typeaheadenter);
	$scope.$on("typeahead:changed", function (sender, value, daset) {
		if (daset.name == 'entities') {
			if ($scope.edit[daset.prop + '_org'].name !== value)
				$scope.edit[daset.prop]._id = null;
		}
	});

	$scope.addEntry = function (id, a) {
		if ($scope.canAddEntry(id, a)) {
			$scope.relation[id].push(a);
			$scope.edit[id] = '';
		}
	};

	$scope.canAddEntry = function (id, a) {
		return ($scope.relation && a && (a.length > 0) && ($scope.relation[id].indexOf(a) < 0));
	};

	$scope.removeEntry = function (id, a) {
		var i = $scope.relation[id].indexOf(a);
		if (i >= 0) {
			$scope.relation[id].splice(i, 1);
		}
	};

	$scope.removeData = function (d) {
		var i = $scope.relation.data.indexOf(d);
		if (i >= 0) {
			$scope.relation.data.splice(i, 1);
		}
	};

	$scope.addData = function (o) {
		$scope.relation.data.push({
			format: o.format,
			key: o.key,
			desc: o.name
		});
	};

	$scope.$watch('relation', function (v) {
		if (v && v.entities) {
			if (v.entities[0])
				entities.item({id: v.entities[0]}, function (data) {
					if (data.error) return reportServerError($scope, data.error);
					$scope.edit.oneorg = data.result.name;
					$scope.edit.one = data.result;
				}, function (err) {
					console.error(err);
				});
			if (v.entities[1])
				entities.item({id: v.entities[1]}, function (data) {
					if (data.error) return reportServerError($scope, data.error);
					$scope.edit.twoorg = data.result.name;
					$scope.edit.two = data.result;
				}, function (err) {
					console.error(err);
				});
		}
	});

};

app.controller('RelationEditCtrl', function ($scope, $state, $stateParams, relations, entities, tags) {
	$scope.isNew = (!$stateParams.id) || ($stateParams.id == 'new');
	relationEditCtrl($scope, $state, relations, entities, tags, function () {
		$state.go('relations');
	});
	if (!$scope.isNew) {
		relations.item({id: $stateParams.id},
			function (data) {
				if (data.error) return reportServerError($scope, data.error);
				$scope.relation = data.result;
			},
			function (err) {
				console.error(err);
			}
		);
	}
});

app.controller('RelationModalEditCtrl', function ($scope, $state, relations, entities, tags) {
	$scope.isNew = !$scope.data.relation._id;
	relationEditCtrl($scope, $state, relations, entities, tags, function () {
		$scope.ok();
	});
	$scope.relation = $scope.data.relation;
});

app.controller('RelationsCtrl', function ($scope, $resource, $filter, $modal, ngTableParams, relations) {

	$scope.q = {
		fields: [
			{name: 'Schlagworte', key: 'tags', format: 'tags', _type: 'fields'},
			{name: 'Art', key: 'type', format: 'string', _type: 'fields'},
		]
	};

	typedListCtrl($scope, $resource, $filter, $modal, ngTableParams, relations);


});

app.controller('RelationsOwnedListCtrl', function ($scope, $modal, relations, entities) {

	$scope.remove = function (rel) {
		okcancelModalDialog($modal,
			{
				headline: 'Verbindung löschen?',
				question: 'Soll "' + $scope.item.name + '"-"' + rel.entity.name + '" gelöscht werden?'
			}
			, function (data) {
				relations.remove({id: rel._id}, function () {
					$scope.relations = $scope.relations.filter(function (oe) {
						return oe != rel;
					});
				}, function (err) {
					console.error(err);
				})
			});
	};

	$scope.edit = function (rel) {
		editModalDialog($modal,
			{
				relation: angular.copy(rel)
			},
			'partials/relation-modal.html'
			, function (data) {
				$scope.relations = $scope.relations.map(function (oe) {
					if (data.relation._id == oe._id) return data.relation;
					return oe;
				});
			});
	};

	$scope.enter = function () {
		editModalDialog($modal,
			{
				relation: {
					entities: [$scope.item._id, '']
				}
			},
			'partials/relation-modal.html'
			, function (result) {
				entities.item({id: $scope.item._id, relations: true}, function (data) {
					if (data.error) return reportServerError($scope, data.error);
					$scope.relations = data.result.relations;
				}, function (err) {
					console.error(err);
				});
			});
	};


	$scope.$watch('item', function (item) {
		if (item)
			$scope.relations = item.relations;
	})
});

app.controller('UserEditCtrl', function ($scope, $state, $stateParams, users) {
	$scope.user = {};
	typedSimpleEditCtrl($scope, $state, $stateParams, users, 'user', 'users', 'Benutzerin');
});

app.controller('FieldEditCtrl', function ($scope, $rootScope, $state, $stateParams, fields) {
	$scope.fieldtypes = [];
	for (var key in $rootScope.globals.fieldtypes) {
		$scope.fieldtypes.push({id: key, name: $rootScope.globals.fieldtypes[key]});
	}
	$scope.field = {format: 'string'};
	typedSimpleEditCtrl($scope, $state, $stateParams, fields, 'field', 'fields', 'Feld');
});

app.controller('PagerCtrl', function ($scope) {
	$scope.pagecount = function () {
		return Math.floor($scope.params.total() / $scope.params.count()) + 1;
	}
});

// ------------------- directives -------------------

app.directive('ngEnter', function () {
	return function (scope, element, attrs) {
		element.bind("keydown keypress", function (event) {
			if (event.which === 13) {
				scope.$apply(function () {
					scope.$eval(attrs.ngEnter);
				});
				event.preventDefault();
			}
		});
	};
});

app.directive('ngtypeahead', function () {
	return {
		restrict: 'AC',       // Only apply on an attribute or class
		require: '?ngModel',  // The two-way data bound value that is returned by the directive
		scope: {
			options: '=',       // The typeahead configuration options (https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md#options)
			datasets: '='       // The typeahead datasets to use (https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md#datasets)
		},
		link: function (scope, element, attrs, ngModel) {

			function init() {
				// Flag if user is selecting or not
				var selecting = false;
				// Create the typeahead on the element
				element.typeahead(scope.options, scope.datasets);

				element.keypress(function (e) {
					if (e.which == 13) {
						scope.$apply(function () {
							scope.$emit('typeahead:enter', e, element.val(), scope.datasets, function () {
								element.typeahead('val', '');
							});
						});
						return true;
					}
				});

				// Parses what is going to be set to model
				ngModel.$parsers.push(function (fromView) {
					var _ref = null;
					if (((_ref = scope.options) != null ? _ref.editable : void 0) === false) {
						ngModel.$setValidity('typeahead', !selecting);
						if (selecting) {
							return undefined;
						}
					}
					return fromView;
				});

				function getCursorPosition(element) {
					var position = 0;
					element = element[0];

					// IE Support.
					if (document.selection) {
						var range = document.selection.createRange();
						range.moveStart('character', -element.value.length);
						position = range.text.length;
					}
					// Other browsers.
					else if (typeof element.selectionStart === 'number') {
						position = element.selectionStart;
					}
					return position;
				}

				function setCursorPosition(element, position) {
					element = element[0];
					if (document.selection) {
						var range = element.createTextRange();
						range.move('character', position);
						range.select();
					}
					else if (typeof element.selectionStart === 'number') {
						element.focus();
						element.setSelectionRange(position, position);
					}
				}

				function updateScope(event, object, suggestion, dataset) {
					// for some reason $apply will place [Object] into element, this hacks around it
					//var preserveVal = element.val();
					scope.$apply(function () {
						selecting = false;
						ngModel.$setViewValue(suggestion[scope.datasets.displayKey]);
						scope.$emit(event, object, suggestion, scope.datasets, function () {
							element.typeahead('val', '');
						});
					});
					//element.val(preserveVal);
				}

				// Update the value binding when a value is manually selected from the dropdown.
				element.bind('typeahead:selected', function (object, suggestion, dataset) {
					updateScope('typeahead:selected', object, suggestion, dataset);
				});

				// Update the value binding when a query is autocompleted.
				element.bind('typeahead:autocompleted', function (object, suggestion, dataset) {
					updateScope('typeahead:autocompleted', object, suggestion, dataset);
				});

				// Propagate the opened event
				element.bind('typeahead:opened', function () {
					scope.$emit('typeahead:opened');
				});

				// Propagate the closed event
				element.bind('typeahead:closed', function () {
					element.typeahead('val', ngModel.$viewValue);
					//element.val(ngModel.$viewValue);
					scope.$emit('typeahead:closed');
				});

				// Propagate the cursorchanged event
				element.bind('typeahead:cursorchanged', function (event, suggestion, dataset) {
					scope.$emit('typeahead:cursorchanged', event, suggestion, dataset);
				});

				// Update the value binding when the user manually enters some text
				element.bind('input',
					function () {
						var preservePos = getCursorPosition(element);
						scope.$apply(function () {
							var value = element.val();
							selecting = true;
							ngModel.$setViewValue(value);
						});
						setCursorPosition(element, preservePos);
						scope.$emit('typeahead:changed', element.val(), scope.datasets);
					}
				);
			}

			if (scope.options && scope.datasets)
				init();
		}
	};
});

app.directive('ngdatafields', function () {
	return {
		restrict: 'A',
		templateUrl: 'partials/datafields.html',
		scope: {
			"fields": "="
		},
		link: function (scope, element, attrs) {
			//scope.$watch('fields', function(v) {
			//	console.log(v);
			//});
		}
	};
});

