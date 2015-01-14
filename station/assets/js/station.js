'use strict';

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

app.run(function ($rootScope, $state, auth) {

	$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
		if (toState.name !== 'login') {
			if (!$rootScope.loggedInUser) {
				event.preventDefault();
				auth.loggedIn(function (data) {
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

app.controller('AppCtrl', function ($rootScope, $scope) {
	'use strict';

});

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

var typedListCtrl = function ($scope, $resource, $filter, $modal, ngTableParams, api) {

	$scope.loading = true;

	var list = [];

	$scope.filter = {
		text: '',
		special:false
	};

	$scope.refilter = function () {
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
			(o.name.indexOf($scope.filter.text) >= 0) ||
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

	api.list(function (data) {
			list = data.result;
			$scope.$watch("filter.text", $scope.refilter);
			$scope.tableParams.reload();
			$scope.loading = false;
		},
		function (err) {
			console.error(err);
		}
	);

};

app.controller('PersonsCtrl', function ($scope, $resource, $filter, $modal, ngTableParams, persons) {
	typedListCtrl($scope, $resource, $filter, $modal, ngTableParams, persons);
});

app.controller('OrganisationsCtrl', function ($scope, $resource, $filter, $modal, ngTableParams, organisations) {
	typedListCtrl($scope, $resource, $filter, $modal, ngTableParams, organisations);
});

app.controller('FieldsCtrl', function ($scope, $resource, $filter, $modal, ngTableParams, fields) {
	typedListCtrl($scope, $resource, $filter, $modal, ngTableParams, fields);
});

app.controller('UsersCtrl', function ($scope, $resource, $filter, $modal, ngTableParams, users) {
	typedListCtrl($scope, $resource, $filter, $modal, ngTableParams, users);
});

app.controller('UsersCtr2l', function ($scope, $state, $stateParams, $filter, ngTableParams, users) {

	var list = [];

	var getData = function ($defer, params) {
		var orderedData = list;//$scope.filter.text.length ? $filter('filter')(list, {'name': $scope.filter.text}) : list;

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

	users.list(function (data) {
			list = data.result;
			$scope.tableParams.reload();
		},
		function (err) {
			console.error(err);
		}
	);

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
		api.item({id: $stateParams.id},
			function (data) {
				$scope.item = data.result;
			},
			function (err) {
				console.error(err);
			}
		);
	}

	fields.list(function (data) {
			$scope.fields = data.result;
		},
		function (err) {
			console.error(err);
		}
	);

	$scope.tags = [];

	tags.list(function (data) {
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

	$scope.save = function () {
		api.save({id: $stateParams.id}, {ent: $scope.item},
			function (data) {
				if (data.error) return alert(JSON.stringify(data.error));
				$scope.back();
			},
			function (err) {
				console.error(err);
			}
		);
	};

	$scope.createnew = function () {
		api.create({ent: $scope.item},
			function (data) {
				if (data.error) return alert(JSON.stringify(data.error));
				$scope.back();
			},
			function (err) {
				console.error(err);
			}
		);
	};

	$scope.needsInput = function (s) {
		return ((!s) || (s.trim().length == 0));
	};
};

app.controller('PersonEditCtrl', function ($scope, $state, $stateParams, persons, fields, tags) {
	$scope.modename = 'Person';
	typedEditCtrl($scope, $state, $stateParams, persons, fields, tags, 'person', 'persons');
});

app.controller('OrganisationEditCtrl', function ($scope, $state, $stateParams, organisations, fields, tags) {
	$scope.modename = 'Organisation';
	typedEditCtrl($scope, $state, $stateParams, organisations, fields, tags, 'organisation', 'organisations');
});

app.controller('LoginCtrl', function ($scope, $state, $stateParams, $resource, $rootScope, auth) {
	$scope.login = {};
	$scope.error = null;

	$scope.loginUser = function () {
		auth.login(
			$scope.login,
			function (data) {
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

app.controller('UserEditCtrl', function ($scope, $state, $stateParams, users) {

	$scope.isNew = ($stateParams.id == 'new');

	$scope.createnew = function () {
		users.create({user: $scope.user},
			function (data) {
				if (data.err) return alert(data.err);
				$state.go('users');
			},
			function (err) {
				console.error(err);
			}
		);
	};

	$scope.save = function () {
		users.save({id: $stateParams.id},
			{user: $scope.user},
			function (data) {
				if (data.err) return alert(data.err);
				$state.go('users');
			},
			function (err) {
				console.error(err);
			}
		);
	};

	if (!$scope.isNew) {
		users.item({id: $stateParams.id},
			function (data) {
				if (data.err) return alert(data.err);
				$scope.user = data.result;
			},
			function (err) {
				console.error(err);
			}
		);
	} else {
		$scope.user = {};
	}

});

app.controller('FieldEditCtrl', function ($scope, $state, $stateParams, fields) {

	$scope.isNew = ($stateParams.id == 'new');

	$scope.createnew = function () {
		fields.create({field: $scope.field},
			function (data) {
				if (data.err) return alert(data.err);
				$state.go('fields');
			},
			function (err) {
				console.error(err);
			}
		);
	};

	$scope.save = function () {
		fields.save({id: $stateParams.id},
			{field: $scope.field},
			function (data) {
				if (data.err) return alert(data.err);
				$state.go('fields');
			},
			function (err) {
				console.error(err);
			}
		);
	};

	if (!$scope.isNew) {
		fields.item({id: $stateParams.id},
			function (data) {
				if (data.err) return alert(data.err);
				$scope.field = data.result;
			},
			function (err) {
				console.error(err);
			}
		);
	} else {
		$scope.field = {format: 'string'};
	}

});

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
				updateScope('typeahead:selected', object, suggestion.value, dataset);
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
	};
});
