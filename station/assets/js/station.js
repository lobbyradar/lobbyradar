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
		.state('whitelist', {
			url: "/whitelist",
			templateUrl: "partials/whitelist.html",
			controller: 'WhitelistCtrl'
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
		.state('entities', {
			url: "/entities",
			templateUrl: "partials/entities.html",
			controller: 'EntitiesCtrl'
		})
		.state('relations', {
			url: "/relations",
			templateUrl: "partials/relations.html",
			controller: 'RelationsCtrl'
		})
		.state('relation', {
			url: "/relation/:id",
			templateUrl: "partials/relation.html"
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
		.state('update', {
			url: "/update",
			templateUrl: "partials/update.html",
			controller: 'UpdateCtrl'
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
				method: 'POST',
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
				method: 'POST',
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
			},
			merge: {
				method: 'POST',
				params: {cmd: 'merge'}
			},
			save: {
				method: 'POST',
				params: {cmd: 'update'}
			},
			remove: {
				method: 'POST',
				params: {cmd: 'delete'}
			},
			multitags: {
				method: 'POST',
				params: {cmd: 'multitags'}
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
				method: 'POST',
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
				method: 'POST',
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

app.factory('autocomplete', function ($resource) {
	'use strict';
	return $resource('/api/field/autocomplete', {}, {
			query: {
				method: 'GET'
				//params: {cmd: 'list'}
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
				method: 'POST',
				params: {cmd: 'delete'}
			},
			tags: {
				method: 'GET',
				params: {cmd: 'tags'}
			},
			types: {
				method: 'GET',
				params: {cmd: 'types'}
			},
			multitags: {
				method: 'POST',
				params: {cmd: 'multitags'}
			}
		}
	);
});

app.factory('whitelist', function ($resource) {
	'use strict';
	return $resource('/api/whitelist/:cmd/:id', {}, {
			list: {
				method: 'GET',
				params: {cmd: 'list'}
			},
			create: {
				method: 'POST',
				params: {cmd: 'create'}
			},
			update: {
				method: 'POST',
				params: {cmd: 'update'}
			},
			remove: {
				method: 'POST',
				params: {cmd: 'delete'}
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

app.factory('update', function ($resource) {
	'use strict';
	return $resource('/api/update/:mode/:cmd/:id', {}, {
			listUpdates: {
				method: 'GET',
				params: {cmd: 'list', mode: 'entity'}
			},
			getUpdate: {
				method: 'GET',
				params: {cmd: 'get', mode: 'entity'}
			},
			deleteUpdate: {
				method: 'POST',
				params: {cmd: 'delete', mode: 'entity'}
			},
			applyEntityData: {
				method: 'POST',
				params: {cmd: 'apply', mode: 'entity'}
			},
			applyRelationData: {
				method: 'POST',
				params: {cmd: 'apply', mode: 'relation'}
			},
			deleteRelation: {
				method: 'POST',
				params: {cmd: 'delete', mode: 'relation'}
			},
			createEntity: {
				method: 'POST',
				params: {cmd: 'create', mode: 'entity'}
			},
			chooseEntity: {
				method: 'POST',
				params: {cmd: 'choose', mode: 'entity'}
			},
			saveEntity: {
				method: 'POST',
				params: {cmd: 'save', mode: 'entity'}
			},
			createRelation: {
				method: 'POST',
				params: {cmd: 'create', mode: 'relation'}
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
		size: 'lg',
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
		size: 'lg',
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
		size: 'lg',
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
	setTimeout(function () {
		alert(err);
	}, 500);
};

var reportConnectionError = function ($scope, err) {
	console.error(err);
	setTimeout(function () {
		alert(err.status + ': ' + err.statusText);
	}, 500);
};


var formatSplitDate = function (date) {
	var result = '';
	if (!date) return result;
	var months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
	if (date.year) {
		if (date.month) {
			if (date.day) {
				result += date.day + '. ';
			}
			result += months[date.month - 1] || '';
		}
		result += ' ' + date.year;
	}
	return result.trim();
};

var formatSplitDateRange = function (start, end) {
	var result = '';
	var seit = formatSplitDate(start);
	var bis = formatSplitDate(end);
	if ((seit.length > 0) || (bis.length > 0)) result += (seit.length > 0 ? seit : '?') + ' - ' + (bis.length > 0 ? bis : '?');
	return result;
};


// ------------------- controllers -------------------

app.controller('AppCtrl', function ($rootScope, $scope, dateFilter, auth) {
	'use strict';
	$rootScope.globals = {
		states: {},
		types: {
			string: {
				"name": "Text",
				defaults: "",
				asString: function (v) {
					return v.value;
				}
			},
			url: {
				"name": "URL",
				defaults: "",
				asString: function (v) {
					return v.value;
				}
			},
			date: {
				"name": "Datum",
				defaults: {},
				asString: function (v) {
					if (v.value.fmt)
						return dateFilter(v.value.date, v.value.fmt);
					else
						return dateFilter(v.value, 'dd.MM.yyyy');
				}
			},
			monthyear: {
				"name": "Datum (Monat/Tag)",
				defaults: {},
				asString: function (v) {
					return ((v.value.month !== null ? v.value.month : '') + ' ' + (v.value.year !== null ? v.value.year : '')).trim();
				}
			},
			range: {
				"name": "Datumbereich",
				defaults: {},
				asString: function (v) {
					return (v.value.desc ? v.value.desc + ': ' : '') +
						((v.value.start_month !== null ? v.value.start_month + '.' : '') + (v.value.start_year !== null ? v.value.start_year : '?'))
						+ ' - ' +
						((v.value.end_month !== null ? v.value.end_month + '.' : '') + (v.value.end_year !== null ? v.value.end_year : '?'));
				}
			},
			photo: {
				"name": "Foto",
				defaults: {},
				asString: function (v) {
					var sl = [];
					if (v.value) {
						if (v.value.url) sl.push(v.value.url);
						if (v.value.copyright) sl.push(v.value.copyright);
					}
					return sl.join('; ');
				}
			},
			bool: {
				"name": "Ja/Nein-Wert",
				defaults: true,
				asString: function (v) {
					return v.value ? 'Ja' : 'Nein';
				}
			},
			tags: {
				"name": "Text-Liste",
				defaults: [],
				asString: function (v) {
					return v.value.join(', ');
				}
			},
			strings: {
				"name": "Text-Liste",
				defaults: [],
				asString: function (v) {
					return v.value.join(', ');
				}
			},
			number: {
				"name": "Zahl",
				defaults: 0,
				asString: function (v) {
					return v.value.toString();
				}
			},
			integer: {
				"name": "Zahl",
				defaults: 0,
				asString: function (v) {
					return v.value.toString();
				}
			},
			address: {
				"name": "Adresse",
				defaults: {},
				asString: function (v) {
					var sl = [];
					if (v.value.name) sl.push(v.value.name);
					if (v.value.addr) sl.push(v.value.addr);
					if (v.value.street) sl.push(v.value.street);
					if (v.value.postcode) sl.push(v.value.postcode);
					if (v.value.city) sl.push(v.value.city);
					if (v.value.country) sl.push(v.value.country);
					return sl.join('; ');
				}
			},
			link: {
				"name": "Link",
				defaults: {},
				asString: function (v) {
					return v.value.url;
				}
			},
			association: {
				"name": "Verbindung",
				defaults: {
					type: 'job',
					start: {},
					end: {},
					sources: [],
					verified: true
				},
				asString: function (v) {
					var sl = [];
					if (v.value.position) sl.push(v.value.position);
					else if (v.value.type) {
						$rootScope.globals.types.association.types.forEach(function (t) {
							if (t.id == v.value.type)
								sl.push(t.name);
						});
					}
					var s = formatSplitDateRange(v.value.start, v.value.end);
					if (s.length > 0) sl.push(s);
					if (v.value.desc && v.value.desc != sl[0]) sl.push(v.value.desc);
					return sl.join(', ');
				},
				types: [{id: 'executive', name: 'Vorstand'}, {id: 'member', name: 'Mitglied'}, {id: 'job', name: 'Arbeitsverhältnis'}, {id: 'government', name: 'Politische Position'}, {id: 'pass', name: 'Ausweis'}, {id: 'business', name: 'Geschäftsverbindung'}, {id: 'subsidiary', name: 'Tochterunternehmen/-gliederung'}, {id: 'sponsoring', name: 'Sponsor'}, {id: 'committee', name: 'Ausschuss'}, {id: 'participant', name: 'Teilnehmer'}]
			},
			donation: {
				"name": "Spende",
				defaults: {
					sources: [],
					verified: true
				},
				asString: function (v) {
					return ((v.value.year !== null ? v.value.year + ':' : '') + ' ' + (v.value.amount !== null ? v.value.amount : '')).trim();
				}
			},
			activity: {
				"name": "Nebeneinkünfte",
				defaults: {
					verified: true
				},
				asString: function (v) {
					var sl = [];
					var s = formatSplitDateRange(v.value.start, v.value.end);
					if (s.length > 0) sl.push(s)
					if (v.value.periodical) sl.push(v.value.periodical);
					if (v.value.position) sl.push(v.value.position);
					if (v.value.place) sl.push(v.value.place);
					if (v.value.activity) sl.push(v.value.activity);
					return sl.join('; ');
				}
			}
		},
		getDisplayValue: function (v) {
			if (v.value == null) return '';
			var type = $rootScope.globals.types[v.format];
			if (type) return type.asString(v);
			return v.value;
		}
	};

	$rootScope.globals.knownFieldTypes = Object.keys($rootScope.globals.types);

	$scope.getDispayValues = function (field, entity) {
		var result = [];
		if (['extras', 'fields'].indexOf(field._type) >= 0) {
			if (entity[field.key] !== undefined) {
				result.push({format: field.format, value: entity[field.key]});
			}
		} else {
			if (entity.data && entity.data.length)
				entity.data.forEach(function (d) {
					if ((field.key == d.key) && (field.format == d.format)) {
						result.push(d);
					}
				})
		}
		return result.map(function (v) {
			return $rootScope.globals.getDisplayValue(v);
		}).join(', ');
	};

	$scope.logout = function () {
		auth.logout(function (data) {
		}, function (err) {
		});
		$rootScope.loggedInUser = null;
		$state.go('login');
	}
});

var typedListCtrl = function ($scope, $resource, $filter, $modal, ngTableParams, api, mode, defaultcount, get_fields) {

	//defaults
	if (!$scope.globals.states[mode]) $scope.globals.states[mode] = {};
	var state = $scope.globals.states[mode];
	$scope.state = state;
	state.filter = state.filter || {
			text: '',
			special: false
		};
	state.table = state.table || {
			page: 1,
			count: defaultcount,
			sorting: {
				name: 'asc'
			}
		};

	$scope.loading = true;

	$scope.list = [];

	$scope.filter = state.filter;

	$scope.refilter = function () {
		if ($scope.list.length)
			$scope.tableParams.reload();
	};

	$scope.resetFilter = function () {
		$scope.filter.text = '';
		$scope.filter.mode = null;
		$scope.refilter();
	};

	$scope.setFilterMode = function (field) {
		$scope.filter.mode = field;
		$scope.refilter();
	};

	$scope.removeFromList = function (id) {
		$scope.list = $scope.list.filter(function (oe) {
			return oe._id != id;
		});
		$scope.tableParams.reload();
	};

	$scope.reloadEntry = function (item, cb) {
		api.item({id: item._id}, function (data) {
			if (data.error) return reportServerError($scope, data.error);
			var i = $scope.list.indexOf(item);
			if (i >= 0) $scope.list[i] = data.result;
			$scope.refilter();
			if (cb) cb();
		}, function (err) {
			reportConnectionError($scope, err);
		});
	};

	$scope.remove = function (o) {
		okcancelModalDialog($modal,
			{
				headline: 'Eintrag löschen?',
				question: 'Soll "' + o.name + '" gelöscht werden?'
			}
			, function () {
				api.remove({id: o._id}, {id: o._id}, function (data) {
					if (data.error) return reportServerError($scope, data.error);
					$scope.removeFromList(o._id);
				}, function (err) {
					reportConnectionError($scope, err);
				})
			});
	};

	$scope.toggleSpecialFilter = function () {
		$scope.filter.special = !$scope.filter.special;
		$scope.refilter();
	};

	var getData = function ($defer, params) {

		state.table.page = params.page();
		state.table.count = params.count();
		state.table.sorting = params.sorting();
		var orderedData = $scope.list;

		if ($scope.filter.text.length > 0) {

			var lowercase = true;

			var searchtext = lowercase ? $scope.filter.text.toLowerCase() : $scope.filter.text;

			var find = function (text) {
				if (lowercase) text = text.toLowerCase();
				return (text.indexOf(searchtext) >= 0);
			};

			var allFilter = function (o) {
				var found = false;
				state.fields.forEach(function (f) {
					if (!found) {
						found = find($scope.getDispayValues(f, o));
					}
				});
				return found;
			};
			var singleFilter = function (o) {
				var s = $scope.getDispayValues($scope.filter.mode, o) || '';
				return find(s);
			};
			orderedData = orderedData.filter($scope.filter.mode ? singleFilter : allFilter);
		}

		if ($scope.filter.special) {
			orderedData = orderedData.filter(function (o) {
				var names = o.name.split(' ');
				return (names.length <= 1) || (names.length > 2);
			});
		}

		var sorting = params.sorting();

		if (sorting) {
			var s = Object.keys(sorting)[0];
			var f = $scope.state.fields.filter(function (f) {
				return f._id == s;
			})[0];
			if (!f) console.log('invalid sort id', s);
			else {
				//console.log('sort by', f);
				var dir = sorting[s] == 'asc' ? 1 : -1;
				orderedData = orderedData.sort(function (a, b) {
					var sa = $scope.getDispayValues(f, a);
					var sb = $scope.getDispayValues(f, b);
					if (sa.length == 0) return 1;
					if (sb.length == 0) return -1;
					if (sa < sb) return -1 * dir;
					if (sa > sb) return 1 * dir;
					return 0;
				});
			}
		}

		params.total(orderedData.length);
		var current = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
		$defer.resolve(current);
	};

	$scope.tableParams = new ngTableParams(state.table, {
		total: 0,
		getData: getData
	});

	$scope.$watch("filter.text", $scope.refilter);

	$scope.reload = function () {
		$scope.loading = true;
		api.list(get_fields ? get_fields() : null,
			function (data) {
				if (data.error) return reportServerError($scope, data.error);
				$scope.list = data.result;
				$scope.tableParams.reload();
				$scope.loading = false;
			},
			function (err) {
				reportConnectionError($scope, err);
			}
		);
	};

	$scope.reload();
};

var entitiesListCtrl = function ($scope, $location, $resource, $filter, $modal, ngTableParams, api, entities, fields, tags, mode, modename) {

	if (!$scope.globals.states[mode]) $scope.globals.states[mode] = {};
	var state = $scope.globals.states[mode];
	$scope.state = state;
	state.fields = state.fields || [];

	$scope.checks = {
		enabled: false,
		value: '',
		dataset: {
			options: {
				minLength: 1,
				highlight: true
			},
			displayKey: "value",
			source: function (q, callback) {
				var matches = [];
				var search = function () {
					var substrRegex = new RegExp(q, 'i');
					$.each($scope.checks.dataset.tags, function (i, s) {
						if (substrRegex.test(s)) {
							matches.push({value: s});
						}
					});
					callback(matches);
				};
				if ($scope.checks.dataset.tags) return search();
				tags.list({type: mode}, function (data) {
						if (data.error) {
							callback(matches);
							return reportServerError($scope, data.error);
						}
						$scope.checks.dataset.tags = data.result;
						search();
					},
					function (err) {
						callback(matches);
						reportConnectionError($scope, err);
					}
				);

			}
		}
	};

	$scope.hasRelationWith = {
		value: null,
		enabled: false,
		dataset: {
			name: 'hasRelationWith',
			options: {
				minLength: 2,
				highlight: true
			},
			displayKey: "name",
			source: function (q, callback) {
				entities.list({search: q}, function (data) {
					if (data.error) return reportServerError($scope, data.error);
					callback(data.result);
				}, function (err) {
					reportConnectionError($scope, err);
				});
			}
		},
		checkFilter: function () {
			if (!$scope.hasRelationWith.enabled)
				$scope.hasRelationWith.filter();
		},
		filter: function () {
			$scope.reload();
		}
	};
	var typeaheadenter = function (sender, event, value, daset, clear) {
		if ((daset.name == 'hasRelationWith') && value && (value._id)) {
			$scope.hasRelationWith.id = value._id;
		}
	};
	$scope.$on("typeahead:enter", function (sender, event, value, daset, clear) {
		typeaheadenter(sender, event, value, daset, clear);
		if ($scope.hasRelationWith.id && (value == '')) $scope.hasRelationWith.filter();
	});
	$scope.$on("typeahead:selected", typeaheadenter);
	$scope.$on("typeahead:changed", function (sender, value, daset) {
		if (daset.name == 'hasRelationWith') {
			$scope.hasRelationWith.id = null;
		}
	});


	$scope.addTag = function () {
		var tag = $scope.checks.value.trim();
		if (tag.length == 0) return reportServerError($scope, 'Ungültiges Schlagwort');
		var list = $scope.list.filter(function (p) {
			return (p.$checked) && (p.tags.indexOf($scope.checks.value) < 0);
		});
		if (list.length == 0) return reportServerError($scope, 'Ungültige Auswahl');
		var ids = list.map(function (p) {
			return p._id;
		});
		entities.multitags({mode: 'add', tag: tag, ids: ids}, function (data) {
			if (data.error) return reportServerError($scope, data.error);
			list.forEach(function (p) {
				p.tags.push(tag);
			});
		}, function (err) {
			reportConnectionError($scope, err);
		});
	};

	$scope.removeTag = function () {
		var tag = $scope.checks.value.trim();
		if (tag.length == 0) return reportServerError($scope, 'Ungültiges Schlagwort');
		var list = $scope.list.filter(function (p) {
			return (p.$checked) && (p.tags.indexOf($scope.checks.value) >= 0);
		});
		if (list.length == 0) return reportServerError($scope, 'Ungültige Auswahl');
		var ids = list.map(function (p) {
			return p._id;
		});
		entities.multitags({mode: 'remove', tag: tag, ids: ids}, function (data) {
			if (data.error) return reportServerError($scope, data.error);
			list.forEach(function (p) {
				p.tags = p.tags.filter(function (t) {
					return t != tag;
				})
			});
		}, function (err) {
			reportConnectionError($scope, err);
		});
	};

	var fixedfields = [
		{_id: 'name', name: 'Name', key: 'name', format: 'string', _type: 'fields'},
		{_id: 'aliases', name: 'Aliase', key: 'aliases', format: 'tags', _type: 'fields'},
		{_id: 'tags', name: 'Schlagworte', key: 'tags', format: 'tags', _type: 'fields'},
		{_id: 'connections', name: 'Anzahl Verbindungen', key: 'connections', format: 'number', _type: 'extras'}
	];
	if (mode == 'all') fixedfields.push({_id: 'type', name: 'Art', key: 'type', format: 'string', _type: 'fields'});

	if (state.fields.length == 0) {
		state.fields.push(fixedfields[0]);
		state.fields.push(fixedfields[1]);
		state.fields.push(fixedfields[2]);
		if (mode == 'all') state.fields.push(fixedfields[4]);
	}

	fields.list({mode: mode == 'entities' ? 'organisations' : mode}, function (data) {
		if (data.error) return reportServerError($scope, data.error);
		$scope.fields = fixedfields.concat(data.result);
	}, function (err) {
		reportConnectionError($scope, err);
	});

	typedListCtrl($scope, $resource, $filter, $modal, ngTableParams, api, mode, 10, function () {
		var q = {};
		state.fields.forEach(function (f) {
			var type = f._type || 'keys';
			q[type] = q[type] || [];
			q[type].push(f.key);
		});
		for (var key in q) {
			q[key] = q[key].join(',');
		}
		if ($scope.hasRelationWith.enabled) {
			if ($scope.hasRelationWith.id)
				q.hasRelationWith = $scope.hasRelationWith.id;
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
						o.dataset = {
							name: 'tags',
							displayKey: "value",
							options: {
								minLength: 1,
								highlight: true
							},
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
										reportConnectionError($scope, err);
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
					fieldsowner: entity,
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
						api.save({id: entity._id}, {id: entity._id, ent: entity},
							function (data) {
								if (data.error) return reportServerError($scope, data.error);
								e.data = entity.data;
								e.aliases = entity.aliases;
								e.tags = entity.tags;
								e.name = entity.name;
								cb();
							},
							function (err) {
								reportConnectionError($scope, err);
							}
						);
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
			reportConnectionError($scope, err);
		});
	};

	$scope.isFieldActive = function (field) {
		return state.fields.filter(function (f) {
				return f.key == field.key;
			}).length > 0;
	};

	$scope.toggleField = function (field) {
		if ($scope.isFieldActive(field)) {
			state.fields = state.fields.filter(function (f) {
				return f.key !== field.key;
			});
		} else {
			state.fields.push(field);
		}
		$scope.reload();
	};

	$scope.relationsDialog = function (item) {
		api.item({id: item._id, relations: true},
			function (data) {
				if (data.error) return reportServerError($scope, data.error);
				infoModalDialog($modal, {
					item: data.result
				}, 'partials/relations-modal.html', function (data) {
					$scope.reloadEntry(item);
				});
			},
			function (err) {
				reportConnectionError($scope, err);
			}
		);
	};

	$scope.mergeDialog = function (item) {
		editModalDialog($modal,
			{
				entity: item,
				modename: modename,
				mode: mode,
				edit: {},
				validate: function (result, cb) {
					if (result.edit._id) {
						entities.merge(
							{ids: [item._id, result.edit._id]},
							function (data) {
								if (data.error) return reportServerError($scope, data.error);
								$scope.removeFromList(result.edit._id);
								$scope.reloadEntry(item, cb);
							},
							function (err) {
								reportConnectionError($scope, err);
							}
						)
					}
				}
			},
			'partials/merge-modal.html'
			, function (data) {
			});

	};

};

app.controller('PersonsCtrl', function ($scope, $location, $resource, $filter, $modal, ngTableParams, persons, entities, fields, tags) {
	entitiesListCtrl($scope, $location, $resource, $filter, $modal, ngTableParams, persons, entities, fields, tags, 'persons', 'Person');
});

app.controller('OrganisationsCtrl', function ($scope, $location, $resource, $filter, $modal, ngTableParams, organisations, entities, fields, tags) {
	entitiesListCtrl($scope, $location, $resource, $filter, $modal, ngTableParams, organisations, entities, fields, tags, 'entities', 'Organisation');
});

app.controller('EntitiesCtrl', function ($scope, $location, $resource, $filter, $modal, ngTableParams, entities, fields, tags) {
	entitiesListCtrl($scope, $location, $resource, $filter, $modal, ngTableParams, entities, entities, fields, tags, 'all', 'Entität');
});

app.controller('RelationsCtrl', function ($scope, $resource, $filter, $modal, ngTableParams, relations, fields, tags) {
	var mode = 'relations';

	if (!$scope.globals.states[mode]) $scope.globals.states[mode] = {};
	var state = $scope.globals.states[mode];
	$scope.state = state;
	state.fields = state.fields || [];

	var fixedfields = [
		{_id: 'name', name: 'Name', key: 'name', format: 'string', _type: 'extras'},
		{_id: 'tags', name: 'Schlagworte', key: 'tags', format: 'tags', _type: 'fields'}
	];

	$scope.isFieldActive = function (field) {
		return state.fields.filter(function (f) {
				return f.key == field.key;
			}).length > 0;
	};

	if (state.fields.length == 0) {
		state.fields.push(fixedfields[0]);
		state.fields.push(fixedfields[1]);
	}

	fields.list({mode: 'relations'}, function (data) {
			if (data.error) return reportServerError($scope, data.error);
			$scope.fields = fixedfields.concat(data.result);
		},
		function (err) {
			reportConnectionError($scope, err);
		}
	);

	typedListCtrl($scope, $resource, $filter, $modal, ngTableParams, relations, mode, 10, function () {
		var q = {};
		state.fields.forEach(function (f) {
			var type = f._type || 'keys';
			q[type] = q[type] || [];
			q[type].push(f.key);
		});
		for (var key in q) {
			q[key] = q[key].join(',');
		}
		return q;
	});

	$scope.toggleField = function (field) {
		if ($scope.isFieldActive(field)) {
			state.fields = state.fields.filter(function (f) {
				return f.key !== field.key;
			});
		} else {
			state.fields.push(field);
		}
		$scope.reload();
	};

	$scope.editData = function (field, r) {
		var result = [];
		relations.item({id: r._id}, function (data) {
			if (data.error) return reportServerError($scope, data.error);
			var rel = data.result;
			if (['extras', 'fields'].indexOf(field._type) >= 0) {
				if (rel[field.key] !== undefined) {
					var o = {
						key: field.key,
						desc: field.name,
						format: field.format,
						value: rel[field.key],
						fixed: true
					};
					if (field.key == 'tags') {
						o.dataset = {
							name: 'tags',
							displayKey: "value",
							options: {
								minLength: 1,
								highlight: true
							},
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
								tags.list({type: 'relations'}, function (data) {
										if (data.error) {
											callback(matches);
											return reportServerError($scope, data.error);
										}
										o.tags = data.result;
										search();
									},
									function (err) {
										callback(matches);
										reportConnectionError($scope, err);
									}
								);
							}
						};
					}
					result.push(o);
				}
			} else {
				if (rel.data && rel.data.length)
					rel.data.forEach(function (d) {
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
					entity: rel,
					fields: angular.copy(result),
					fieldsowner: rel,
					validate: function (data, cb) {
						data.fields.forEach(function (f) {
							if (f.fixed) {
								//update fixed field
								rel[f.key] = f.value;
							} else {
								var i = -1;
								if (f.id) {
									var oldfield = rel.data.filter(function (fe) {
										return fe.id == f.id;
									})[0];
									i = rel.data.indexOf(oldfield);
								}
								if (i >= 0) {
									//update field
									rel.data[i] = f;
								} else {
									//new field
									rel.data.push(f);
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
									var oldfield = rel.data.filter(function (fe) {
										return fe.id == f.id;
									})[0];
									var i = rel.data.indexOf(oldfield);
									if (i >= 0) {
										rel.data.splice(i, 1);
									}
								}
							}
						});
						relations.save({id: rel._id}, {id: rel._id, relation: rel},
							function (data) {
								if (data.error) return reportServerError($scope, data.error);
								r.data = rel.data;
								r.type = rel.type;
								r.tags = rel.tags;
								//r.name = rel.name;
								cb();
							},
							function (err) {
								reportConnectionError($scope, err);
							}
						);
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
			reportConnectionError($scope, err);
		});
	};

	$scope.checks = {
		enabled: false,
		value: '',
		dataset: {
			options: {
				minLength: 1,
				highlight: true
			},
			displayKey: "value",
			source: function (q, callback) {
				var matches = [];
				var search = function () {
					var substrRegex = new RegExp(q, 'i');
					$.each($scope.checks.dataset.tags, function (i, s) {
						if (substrRegex.test(s)) {
							matches.push({value: s});
						}
					});
					callback(matches);
				};
				if ($scope.checks.dataset.tags) return search();
				tags.list({type: 'relations'}, function (data) {
						if (data.error) {
							callback(matches);
							return reportServerError($scope, data.error);
						}
						$scope.checks.dataset.tags = data.result;
						search();
					},
					function (err) {
						callback(matches);
						reportConnectionError($scope, err);
					}
				);

			}
		}
	};

	$scope.addTag = function () {
		var tag = $scope.checks.value.trim();
		if (tag.length == 0) return reportServerError($scope, 'Ungültiges Schlagwort');
		var list = $scope.list.filter(function (p) {
			return (p.$checked) && (p.tags.indexOf($scope.checks.value) < 0);
		});
		if (list.length == 0) return reportServerError($scope, 'Ungültige Auswahl');
		var ids = list.map(function (p) {
			return p._id;
		});
		relations.multitags({mode: 'add', tag: tag, ids: ids}, function (data) {
			if (data.error) return reportServerError($scope, data.error);
			list.forEach(function (p) {
				p.tags.push(tag);
			});
		}, function (err) {
			reportConnectionError($scope, err);
		});
	};

	$scope.removeTag = function () {
		var tag = $scope.checks.value.trim();
		if (tag.length == 0) return reportServerError($scope, 'Ungültiges Schlagwort');
		var list = $scope.list.filter(function (p) {
			return (p.$checked) && (p.tags.indexOf($scope.checks.value) >= 0);
		});
		if (list.length == 0) return reportServerError($scope, 'Ungültige Auswahl');
		var ids = list.map(function (p) {
			return p._id;
		});
		relations.multitags({mode: 'remove', tag: tag, ids: ids}, function (data) {
			if (data.error) return reportServerError($scope, data.error);
			list.forEach(function (p) {
				p.tags = p.tags.filter(function (t) {
					return t != tag;
				})
			});
		}, function (err) {
			reportConnectionError($scope, err);
		});
	};

});

app.controller('FieldsCtrl', function ($scope, $resource, $filter, $modal, ngTableParams, fields) {
	typedListCtrl($scope, $resource, $filter, $modal, ngTableParams, fields, 'fields', 200);
	$scope.fields = [
		{_id: 'name', name: 'Name', key: 'name', format: 'string', _type: 'fields'},
		{_id: 'key', name: 'Schlüssel', key: 'key', format: 'string', _type: 'fields'},
		{_id: 'format', name: 'Format', key: 'format', format: 'string', _type: 'fields'},
		{_id: 'mode', name: 'Typ', key: 'mode', format: 'string', _type: 'fields'},
		{_id: 'default', name: 'Standard', key: 'default', format: 'bool', _type: 'fields'}
	];
	$scope.state.fields = $scope.fields;
});

app.controller('UsersCtrl', function ($scope, $resource, $filter, $modal, ngTableParams, users) {
	typedListCtrl($scope, $resource, $filter, $modal, ngTableParams, users, 'users', 200);
	$scope.fields = [{_id: 'name', name: 'Name', key: 'name', format: 'string', _type: 'fields'}];
	$scope.state.fields = $scope.fields;
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

app.controller('StringsEdit', function ($scope) {

	$scope.currentedit = '';

	$scope.addEntry = function (field, name, a) {
		if ($scope.canAddEntry(field, name, a)) {
			field[name] = field[name] || [];
			field[name].push(a);
			$scope.currentedit = '';
		}
	};

	$scope.canAddEntry = function (field, name, a) {
		return (a && (a.length > 0) && ((!field[name]) || (field[name].indexOf(a) < 0)));
	};

	$scope.removeEntry = function (field, name, a) {
		field[name] = field[name] || [];
		var i = field[name].indexOf(a);
		if (i >= 0) {
			field[name].splice(i, 1);
		}
	};
});

app.controller('SearchEntitiesCtrl', function ($scope, entities) {
	var mode = $scope.data.mode;
	$scope.data.org = {};
	$scope.typeaheadDatasetEntities = {
		name: 'entities',
		displayKey: "name",
		options: {
			minLength: 2,
			highlight: true
		},
		source: function (q, callback) {
			entities.list(
				{
					search: q,
					type: mode == 'persons' ? 'person' : 'entity'
				},
				function (data) {
					if (data.error) return reportServerError($scope, data.error);
					callback(data.result);
				}, function (err) {
					reportConnectionError($scope, err);
				});
		}
	};

	var typeaheadenter = function (sender, event, value, daset, clear) {
		if (typeof value !== 'string') {
			$scope.data.org.name = value.name;
			$scope.data.edit.name = value.name;
			$scope.data.edit._id = value._id;
		}
	};
	$scope.$on("typeahead:enter", typeaheadenter);
	$scope.$on("typeahead:selected", typeaheadenter);
	$scope.$on("typeahead:changed", function (sender, value, daset) {
		if ($scope.data.org.name !== value)
			$scope.data.edit._id = null;
	});
});

var typedEntityEditCtrl = function ($scope, $state, $stateParams, api, fields, tags, type, mode, modename) {
	$scope.modename = modename;
	$scope.validate = function (cb) {
		$scope.item.auto = false;
		if ($scope.edit.tags && ($scope.edit.tags.length > 0)) {
			$scope.addEntry('tags', $scope.edit.tags);
		}
		cb();
	};

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
				reportConnectionError($scope, err);
			}
		);
	}

	fields.list({mode: mode == 'entities' ? 'organisations' : mode}, function (data) {
			if (data.error) return reportServerError($scope, data.error);
			$scope.fields = data.result;
			if ($scope.isNew) {
				$scope.fields.forEach(function (f) {
					if (f.default) {
						$scope.addData(f);
					}
				});
			}
		},
		function (err) {
			reportConnectionError($scope, err);
		}
	);

	$scope.tags = [];

	tags.list({type: 'entities'}, function (data) {
			if (data.error) return reportServerError($scope, data.error);
			$scope.tags = data.result;
		},
		function (err) {
			reportConnectionError($scope, err);
		}
	);

	//typeahead callbacks
	$scope.datasetTags = {
		name: 'tags',
		displayKey: "value",
		options: {
			minLength: 1,
			highlight: true
		},
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

	$scope.addData = function (o) {
		$scope.item.data.push({
			format: o.format,
			key: o.key,
			desc: o.name,
			value: angular.copy($scope.globals.types[o.format].defaults)
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
			api.save({id: $stateParams.id}, {id: $stateParams.id, ent: $scope.item},
				function (data) {
					if (data.error) return reportServerError($scope, data.error);
					$scope.back();
				},
				function (err) {
					reportConnectionError($scope, err);
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
					reportConnectionError($scope, err);
				}
			);
		});
	};

	$scope.needsInput = function (s) {
		return ((!s) || (s.trim().length == 0));
	};
};

app.controller('PersonEditCtrl', function ($scope, $state, $stateParams, persons, fields, tags) {
	typedEntityEditCtrl($scope, $state, $stateParams, persons, fields, tags, 'person', 'persons', 'Person');
});

app.controller('OrganisationEditCtrl', function ($scope, $state, $stateParams, organisations, fields, tags) {
	typedEntityEditCtrl($scope, $state, $stateParams, organisations, fields, tags, 'entity', 'entities', 'Organisation');
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
					reportConnectionError($scope, err);
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
					reportConnectionError($scope, err);
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
				reportConnectionError($scope, err);
			}
		);
	}

};

var relationEditCtrl = function ($scope, $state, relations, entities, tags, fields, aftersave) {

	$scope.edit = {
		one: {},
		one_org: {},
		two: {},
		two_org: {}
	};

	$scope.validate = function (cb) {
		$scope.relation.auto = false;
		if ($scope.edit.tags && ($scope.edit.tags.length > 0)) {
			$scope.addEntry('tags', $scope.edit.tags);
		}
		cb();
	};

	$scope.relation = $scope.relation || {
			tags: [],
			entities: ['', ''],
			data: [],
			type: 'general'
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
					reportConnectionError($scope, err);
				}
			);
		});
	};

	$scope.save = function () {
		$scope.validate(function () {
			relations.save({id: $scope.relation._id}, {id: $scope.relation._id, relation: $scope.relation},
				function (data) {
					if (data.error) return reportServerError($scope, data.error);
					aftersave();
				},
				function (err) {
					reportConnectionError($scope, err);
				}
			);
		});
	};

	$scope.back = function () {
		$state.go('relations');
	};

	$scope.tags = [];
	$scope.types = [];

	tags.list({type: 'relations'},
		function (data) {
			if (data.error) return reportServerError($scope, data.error);
			$scope.tags = data.result;
		},
		function (err) {
			reportConnectionError($scope, err);
		}
	);

	relations.types({},
		function (data) {
			if (data.error) return reportServerError($scope, data.error);
			$scope.types = data.result;
		},
		function (err) {
			reportConnectionError($scope, err);
		}
	);

	fields.list({mode: 'relations'}, function (data) {
			if (data.error) return reportServerError($scope, data.error);
			$scope.fields = data.result;
			if ($scope.isNew) {
				$scope.fields.forEach(function (f) {
					if (f.default) {
						$scope.addData(f);
					}
				});
			}
		},
		function (err) {
			reportConnectionError($scope, err);
		}
	);

	var datasetEntity = function (prop) {
		return {
			name: 'entities',
			prop: prop,
			options: {
				minLength: 2,
				highlight: true
			},
			displayKey: "name",
			source: function (q, callback) {
				entities.list({search: q},
					function (data) {
						if (data.error) return reportServerError($scope, data.error);
						callback(data.result);
					}, function (err) {
						reportConnectionError($scope, err);
					});
			}
		};
	};

	$scope.datasetEntitiesOne = datasetEntity('one');
	$scope.datasetEntitiesTwo = datasetEntity('two');

	$scope.datasetTypes = {
		name: 'types',
		displayKey: "value",
		options: {
			minLength: 1,
			highlight: true
		},
		source: function (q, callback) {
			var matches, substrRegex;
			matches = [];
			substrRegex = new RegExp(q, 'i');
			$.each($scope.types, function (i, s) {
				if (substrRegex.test(s)) {
					matches.push({value: s});
				}
			});
			callback(matches);
		}
	};

	//typeahead callbacks
	$scope.datasetTags = {
		name: 'tags',
		displayKey: "value",
		options: {
			minLength: 1,
			highlight: true
		},
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

	$scope.addData = function (o) {
		$scope.relation.data.push({
			format: o.format,
			key: o.key,
			desc: o.name,
			value: angular.copy($scope.globals.types[o.format].defaults)
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
					reportConnectionError($scope, err);
				});
			if (v.entities[1])
				entities.item({id: v.entities[1]}, function (data) {
					if (data.error) return reportServerError($scope, data.error);
					$scope.edit.twoorg = data.result.name;
					$scope.edit.two = data.result;
				}, function (err) {
					reportConnectionError($scope, err);
				});
		}
	});

};

app.controller('RelationEditCtrl', function ($scope, $state, $stateParams, relations, entities, tags, fields) {
	if ($scope.data && $scope.data.relation) {
		$scope.relation = $scope.data.relation;
		$scope.isNew = false;
	} else {
		$scope.isNew = (!$stateParams.id) || ($stateParams.id == 'new');
	}
	relationEditCtrl($scope, $state, relations, entities, tags, fields, function () {
		$state.go('relations');
	});
	if ($scope.data && $scope.data.relation) {
		$scope.relation = $scope.data.relation;
		$scope.isNew = false;
	} else if ((!$scope.isNew) && ($state.current.name !== 'person')) {
		relations.item({id: $stateParams.id},
			function (data) {
				if (data.error) return reportServerError($scope, data.error);
				$scope.relation = data.result;
			},
			function (err) {
				reportConnectionError($scope, err);
			}
		);
	}
});

app.controller('RelationModalEditCtrl', function ($scope, $state, relations, entities, tags, fields) {
	$scope.isNew = !$scope.data.relation._id;
	$scope.relation = $scope.data.relation;
	relationEditCtrl($scope, $state, relations, entities, tags, fields, function () {
		$scope.ok();
	});
});

app.controller('RelationsOwnedListCtrl', function ($scope, $modal, relations, entities) {

	$scope.remove = function (rel) {
		okcancelModalDialog($modal,
			{
				headline: 'Verbindung löschen?',
				question: 'Soll "' + $scope.item.name + '"-"' + rel.entity.name + '" gelöscht werden?'
			}
			, function () {
				relations.remove({id: rel._id}, {id: rel._id}, function () {
					$scope.relations = $scope.relations.filter(function (oe) {
						return oe != rel;
					});
				}, function (err) {
					reportConnectionError($scope, err);
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
					entities: [$scope.item._id, ''],
					tags: [],
					data: []
				}
			},
			'partials/relation-modal.html'
			, function () {
				entities.item({id: $scope.item._id, relations: true}, function (data) {
					if (data.error) return reportServerError($scope, data.error);
					$scope.relations = data.result.relations;
				}, function (err) {
					reportConnectionError($scope, err);
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
	for (var key in $rootScope.globals.types) {
		$scope.fieldtypes.push({id: key, name: $rootScope.globals.types[key].name});
	}
	$scope.field = {format: 'string'};
	typedSimpleEditCtrl($scope, $state, $stateParams, fields, 'field', 'fields', 'Feld');
});

app.controller('PagerCtrl', function ($scope) {
	$scope.pagecount = function () {
		return Math.floor($scope.params.total() / $scope.params.count()) + 1;
	}
});

app.controller('WhitelistCtrl', function ($scope, $resource, $filter, $modal, ngTableParams, whitelist) {

	typedListCtrl($scope, $resource, $filter, $modal, ngTableParams, {
		list: function (opt, onsuccess, onerror) {
			whitelist.list(opt, function (data) {
				if (data && data.result) {
					data.result = data.result.map(function (item) {
						return {_id: item, name: item};
					});
				}
				onsuccess(data);
			}, onerror);
		},
		remove: function (opt, opt2, onsuccess, onerror) {
			whitelist.remove({site: opt.id}, {site: opt.id}, onsuccess, onerror);
		}
	}, 'whitelist', 5000);

	$scope.fields = [{_id: 'name', name: 'URL', key: 'name', format: 'string', _type: 'fields'}];
	$scope.state.fields = $scope.fields;

	$scope.newEntry = function () {
		editModalDialog($modal,
			{
				isNew: true,
				site: '',
				validate: function (d, cb) {
					whitelist.create({site: d.site}, function (data) {
							if (data.error) return reportServerError($scope, data.error);
							if (data.result) {
								$scope.list.push({_id: d.site, name: d.site})
							}
							cb();
						},
						function (err) {
							reportConnectionError($scope, err);
						}
					)
				}
			},
			'partials/whitelist-edit-modal.html'
			, function (data) {
				$scope.refilter();
			});
	};

	$scope.editEntry = function (p) {
		editModalDialog($modal,
			{
				isNew: false,
				site: p.name,
				validate: function (d, cb) {
					whitelist.update({site: p.name, replacement: d.site}, function (data) {
							if (data.error) return reportServerError($scope, data.error);
							if (data.result) {
								p.name = d.site;
							}
							cb();
						},
						function (err) {
							reportConnectionError($scope, err);
						}
					)
				}
			},
			'partials/whitelist-edit-modal.html'
			, function (data) {
				$scope.refilter();
			});
	};
});

app.controller('DatepickerCtrl', function ($scope) {

	$scope.dtp_today = function () {
		if ($scope.dtp_range_value) {
			$scope.dtp_value.start = new Date();
			$scope.dtp_value.end = new Date();
		} else {
			$scope.dtp_value.date = new Date();
		}
	};

	$scope.dtp_clear = function () {
		if ($scope.dtp_range_value) {
			$scope.dtp_value.start = null;
			$scope.dtp_value.end = null;
		} else {
			$scope.dtp_value.date = null;
		}
	};

	$scope.dtp_open = function ($event) {
		$event.preventDefault();
		$event.stopPropagation();
		$scope.dtp_opened = true;
	};

	$scope.dtp_dateOptions = {
		formatYear: 'yyyy',
		startingDay: 1
	};

	$scope.dtp_formats = [
		{name: 'dd.mm.yyyy', fmt: 'dd.MM.yyyy', mode: 'day'},
		{name: 'mm.yyyy', fmt: 'MM.yyyy', mode: 'month'},
		{name: 'yyyy', fmt: 'yyyy', mode: 'year'}
	];

	$scope.$watch('dtp_value', function (v) {
		if (v) {
			if (!v.fmt) v.fmt = $scope.dtp_formats[0].fmt;
		}
	});

});

app.controller('Datepicker2Ctrl', function ($scope, dateFilter) {

	$scope.dtp = {
		options: {
			formatYear: 'yyyy',
			startingDay: 1
		},
		date: null,
		splitdate: null,
		opened: false,
		formats: [
			{name: 'dd.mm.yyyy', fmt: 'dd.MM.yyyy', mode: 'day'},
			{name: 'mm.yyyy', fmt: 'MM.yyyy', mode: 'month'},
			{name: 'yyyy', fmt: 'yyyy', mode: 'year'}
		],
		open: function ($event) {
			$event.preventDefault();
			$event.stopPropagation();
			$scope.dtp.opened = true;
		},
		validate: function () {
			if (!$scope.dtp.date) {
				displaySplitValue($scope.dtp.splitdate);
			}
		}
	};
	$scope.dtp.fmt = $scope.dtp.formats[0];

	$scope.dtp_today = function () {
		$scope.dtp.date = new Date();
	};

	$scope.dtp_clear = function () {
		$scope.dtp.date = null;
	};

	var apply = function () {
		if (!$scope.dtp_value) return;
		if (!$scope.dtp.splitdate) return;
		if (!$scope.dtp.date) return;
		var i = $scope.dtp.formats.indexOf($scope.dtp.fmt);
		if (i == 0) {
			$scope.dtp.splitdate.year = $scope.dtp.date.getFullYear();
			$scope.dtp.splitdate.month = $scope.dtp.date.getMonth() + 1;
			$scope.dtp.splitdate.day = $scope.dtp.date.getDate();
		} else if (i == 1) {
			$scope.dtp.splitdate.year = $scope.dtp.date.getFullYear();
			$scope.dtp.splitdate.month = $scope.dtp.date.getMonth() + 1;
			delete $scope.dtp.splitdate.day;
		} else {
			$scope.dtp.splitdate.year = $scope.dtp.date.getFullYear();
			delete $scope.dtp.splitdate.month;
			delete $scope.dtp.splitdate.day;
		}
	};

	var displaySplitValue = function (v) {
		if (v && v.year) {
			$scope.dtp.date = new Date(v.year, v.month ? v.month - 1 : 0, v.day ? v.day : 1);
		}
	};

	$scope.$watch('dtp.date', function (d) {
		if (d)
			apply();
	});
	$scope.$watch('dtp.fmt', function (d) {
		if (d) {
			$scope.dtp.options.datepickerMode = d.mode;
			apply();
			displaySplitValue($scope.dtp.splitdate);
		}
	});
	$scope.$watch('dtp_value', function (d) {
		if (d) {
			var v = (d.val[d.name]);
			if (!v) {
				d.val[d.name] = {};
				v = d.val[d.name];
			}
			$scope.dtp.splitdate = v;
			var format = 0;
			if (v) {
				if (v.day) format = 0;
				else if (v.month) format = 1;
				else if (v.year) format = 2;
				//displaySplitValue(v);
				//if (v.year) {
				//	$scope.dtp.date = new Date(v.year, v.month ? v.month - 1 : 0, v.day ? v.day : 1);
				//}
				$scope.dtp.fmt = $scope.dtp.formats[format];
			}
		}
	});

});

app.controller('AutoCompleteCtrl', function ($scope, autocomplete) {
	var d = $scope.d;
	if (d && (d.format == 'string')) {
		var query = {
			type: ['person', 'entity'].indexOf($scope.fieldsowner.type) < 0 ? 'relation' : $scope.fieldsowner.type,
			key: d.key
		};
		$scope.datasetString = {
			name: d.key,
			prop: d.key,
			options: {
				minLength: 2,
				highlight: true
			},
			displayKey: "value",
			source: function (q, callback) {
				query.q = q;
				autocomplete.query(query,
					function (data) {
						if (data.error) return reportServerError($scope, data.error);
						callback(data.result);
					}, function (err) {
						reportConnectionError($scope, err);
					});
			}
		};
	}
});

app.controller('FieldListEditCtrl', function ($scope, $rootScope) {

	$scope.getFieldPartial = function (d) {
		if ($rootScope.globals.knownFieldTypes.indexOf(d.format) >= 0)
			return 'partials/datafield-' + d.format + '.html';
		else
			return 'partials/datafield-default.html';
	};

	$scope.removeData = function (d, list) {
		var i = list.indexOf(d);
		if (i >= 0) {
			list.splice(i, 1);
		}
	};
});

app.controller('ModalUpdateEditorCtrl', function ($scope, fields, tags, update) {
	var item = angular.copy($scope.data.item);

	$scope.data.validate = function (result, cb) {
		update.saveEntity({id: item._id}, {id: item._id, ent: item},
			function (data) {
				if (data.error) return reportServerError($scope, data.error);
				$scope.data.update = data.result;
				cb(true);
			},
			function (err) {
				reportConnectionError($scope, err);
			}
		);
	};
	var modename = item.type == 'person' ? 'Person' : 'Organisation';
	var mode = item.type == 'person' ? 'persons' : 'entities';
	$scope.edit = {};
	typedEntityEditCtrl($scope, {}, {}, {
		item: function (params, cb) {
			cb(item);
		}
	}, fields, tags, item.type, mode, modename);
	$scope.item = item;
});

app.controller('UpdateCtrl', function ($scope, $modal, update) {

	$scope.updates = [];

	update.listUpdates(function (data) {
		data.result.sort(function (a, b) {
			if (a.name < b.name) return -1;
			if (a.name > b.name) return 1;
			return 0;
		});

		$scope.updates = data.result;
	}, function (err) {
		console.log(err);
	});


	$scope.curPage = 0;
	$scope.pageSize = 25;

	$scope.params = {
		total: function () {
			return $scope.updates.length;
		},
		page: function (nr) {
			if (!isNaN(nr)) $scope.curPage = nr - 1;
			return $scope.curPage + 1;

		},
		count: function (nr) {
			if (!isNaN(nr)) $scope.pageSize = nr;
			return $scope.pageSize;
		}
	};

	$scope.show = function (entry) {
		if (entry.$loading) return;
		if (entry.$visible) {
			entry.update = null;
			entry.$visible = false;
			return;
		}
		if (!entry.update) {
			entry.$loading = true;
			update.getUpdate({id: entry._id}, function (data) {
				entry.update = data.result;
				entry.$loading = false;
				entry.$visible = true;
			}, function (err) {
				console.log(err);
			});
		} else {
			entry.$visible = true;
		}
	};

	var removeUpdate = function (id) {
		$scope.updates = $scope.updates.filter(function (entry) {
			return (entry._id !== id);
		});
		$scope.updates.forEach(function (entry) {
			if (entry.update) {
				var hasEntryToRemove = false;
				entry.update.relations.forEach(function (rel_info) {
					if (rel_info.entity._id == id) {
						hasEntryToRemove = true;
					}
				});
				if (hasEntryToRemove) {
					entry.update.relations = entry.update.relations.filter(function (rel_info) {
						return (rel_info.entry._id !== id);
					});
				}
			}
		});

	};

	var applyResult = function (data) {
		if (data.error) {
			alert(data.error);
			return reportServerError($scope, data.error);
		}
		data = angular.isArray(data.result) ? data.result : [data.result];
		data.forEach(function (update) {
			if (update.deleted) return removeUpdate(update._id);
			var id = update.entity._id;
			$scope.updates.forEach(function (entry) {
				if (entry._id == id) {
					entry.name = update.entity.name;
					entry.update = update;
				} else if (entry.update) {
					entry.update.relations.forEach(function (rel_info) {
						if (rel_info.entity._id == id) {
							rel_info.entity = update.entity;
						}
					});
				}
			});
		});
	};


	$scope.searchEntity = function (entity) {
		editModalDialog($modal,
			{
				mode: entity.type == 'person' ? 'persons' : 'entities',
				modename: entity.type == 'person' ? 'Person' : 'Organisation',
				item: entity,
				validate: function (data, cb) {
					if (!data.edit._id) return;
					update.chooseEntity({id: entity._id}, {ent: data.edit._id},
						function (data) {
							applyResult(data);
							cb(true);
						},
						function (err) {
							reportConnectionError($scope, err);
						}
					);
				}
			},
			'partials/search-modal.html'
			, function (data) {
			});
	};

	$scope.editEntity = function (entity) {
		editModalDialog($modal,
			{
				item: entity
			},
			'partials/update-entity-modal.html'
			, function (data) {
				applyResult({result: data.update});
			});
	};

	$scope.deleteEntity = function (entry) {
		update.deleteUpdate({id: entry._id}, {id: entry._id}, applyResult, function (err) {
			console.log(err);
		});
	};

	$scope.deleteRelation = function (rel) {
		update.deleteRelation({id: rel._id}, {id: rel._id}, applyResult, function (err) {
			console.log(err);
		});
	};

	$scope.createEntity = function (entry) {
		update.createEntity({id: entry._id}, {id: entry._id}, applyResult, function (err) {
			console.log(err);
		});
	};

	$scope.applyEntityData = function (data, entry) {
		update.applyEntityData({id: entry._id}, {data_id: data.id}, applyResult, function (err) {
			console.log(err);
		});
	};

	$scope.applyRelationData = function (data, rel) {
		update.applyRelationData({id: rel._id}, {data_id: data.id}, applyResult, function (err) {
			console.log(err);
		});
	};

	$scope.createRelation = function (rel) {
		update.createRelation({id: rel._id}, {id: rel._id}, applyResult, function (err) {
			console.log(err);
		});
	}
});

// ------------------- filter -------------------

app.filter('pagination', function () {
	return function (input, start) {
		start = +start;
		return input.slice(start);
	};
});

app.filter('fieldvalue', function ($rootScope) {
	'use strict';
	return function (input) {
		if (input == null) return "";
		return $rootScope.globals.getDisplayValue(input);
	};
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
			datasets: '='       // The typeahead configuration options (https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md#options) with options subobject for The typeahead datasets to use (https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md#datasets)
		},
		link: function (scope, element, attrs, ngModel) {

			function init() {
				// Flag if user is selecting or not
				var selecting = false;
				// Create the typeahead on the element
				element.typeahead(scope.datasets.options, scope.datasets);

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
					if (((_ref = scope.datasets.options) != null ? _ref.editable : void 0) === false) {
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

			if (scope.datasets)
				init();
		}
	};
});

app.directive('ngdatafields', function () {
	return {
		restrict: 'A',
		templateUrl: 'partials/datafields.html',
		scope: {
			"fields": "=",
			"fieldsowner": "="
		},
		link: function (scope, element, attrs) {
			//scope.$watch('fields', function(v) {});
		}
	};
});

