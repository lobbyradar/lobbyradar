'use strict';

var app = angular.module('Station', ['ui.router', 'ngTable', 'ngResource']);

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
			type:'entity'
		}, {
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
			}
		}
	);
});

app.factory('persons', function ($resource) {
	'use strict';
	return $resource('/api/entity/:cmd/:id', {type:'person'}, {
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

var typedListCtrl = function ($scope, $resource, $filter, ngTableParams, api) {

	$scope.loading = true;

	var list = [];

	$scope.filter = {
		text: ''
	};

	$scope.refilter = function () {
		$scope.tableParams.reload();
	};

	$scope.resetFilter = function () {
		$scope.filter.text = '';
		$scope.tableParams.reload();
	};

	var getData = function ($defer, params) {
		//var orderedData = params.filter() ?
		//	$filter('filter')(list, params.filter()) :
		//	list;

		var orderedData = $scope.filter.text.length ? $filter('filter')(list, {'name': $scope.filter.text}) : list;

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

app.controller('PersonsCtrl', function ($scope, $resource, $filter, ngTableParams, persons) {
	'use strict';
	typedListCtrl($scope, $resource, $filter, ngTableParams, persons);
});

app.controller('OrganisationsCtrl', function ($scope, $resource, $filter, ngTableParams, organisations) {
	typedListCtrl($scope, $resource, $filter, ngTableParams, organisations);
});

app.controller('FieldsCtrl', function ($scope, $resource, $filter, ngTableParams, fields) {
	typedListCtrl($scope, $resource, $filter, ngTableParams, fields, 'field');
});

var typedEditCtrl = function ($scope, $state, $stateParams, api) {

	$scope.edit = {};

	api.item({id: $stateParams.id},
		function (data) {
			$scope.item = data.result;
		},
		function (err) {
			console.error(err);
		}
	);

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

	$scope.addData = function (format) {
		$scope.item.data.push({
			format: format
		});
	};

	$scope.back = function () {
		$state.go($scope.isPerson ? 'persons' : 'organisations');
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

	$scope.needsInput = function (s) {
		return ((!s) || (s.trim().length == 0));
	};
};

app.controller('PersonEditCtrl', function ($scope, $state, $stateParams, api) {
	$scope.modename = 'Person';
	$scope.isPerson = true;
	typedEditCtrl($scope, $state, $stateParams, api);
});

app.controller('OrganisationEditCtrl', function ($scope, $state, $stateParams, api) {
	$scope.modename = 'Organisation';
	$scope.isPerson = false;
	typedEditCtrl($scope, $state, $stateParams, api);
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

	$scope.create = function () {
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
			{user: $scope.user},
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

app.controller('UsersCtrl', function ($scope, $state, $stateParams, $filter, ngTableParams, users) {

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