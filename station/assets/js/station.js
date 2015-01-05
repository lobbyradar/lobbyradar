'use strict';

var app = angular.module('Station', ['ui.router', 'ngTable', 'ngResource']);

app.config(function ($stateProvider, $urlRouterProvider) {
	'use strict';

	$urlRouterProvider.otherwise("/start");

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
		});
});

app.factory('api', function ($resource) {
	'use strict';
	return $resource('/api/entity/:cmd/:id', {
			apikey: 'ffalt'
		}, {
			list: {
				method: 'GET',
				params: {cmd: 'list'}
			},
			item: {
				method: 'GET',
				params: {cmd: 'get'}
			}
		}
	);
});

app.controller('AppCtrl', function ($scope) {
	'use strict';

});

var typedListCtrl = function ($scope, $resource, $filter, ngTableParams, api, type) {
	var list = [];

	var getData = function ($defer, params) {
		var orderedData = params.filter() ?
			$filter('filter')(list, params.filter()) :
			list;
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

	api.list({type: type},
		function (data) {
			list = data.result;
			$scope.tableParams.reload();
		},
		function (err) {
			console.error(err);
		}
	);

};

app.controller('PersonsCtrl', function ($scope, $resource, $filter, ngTableParams, api) {
	'use strict';
	typedListCtrl($scope, $resource, $filter, ngTableParams, api, 'person');
});

app.controller('OrganisationsCtrl', function ($scope, $resource, $filter, ngTableParams, api) {
	typedListCtrl($scope, $resource, $filter, ngTableParams, api, 'entity');
});

var typedEditCtrl = function ($scope, $stateParams, api) {

	api.item({id: $stateParams.id},
		function (data) {
			$scope.item = data.result;
		},
		function (err) {
			console.log('err', err);
		}
	);

	$scope.addSource = function (link, comment) {
		$scope.item.sources.push({
			url: link,
			remark: comment
		});
	};

	$scope.addEntry = function (id, a) {
		if ($scope.canAddEntry(id, a))
			$scope.item[id].push(a);
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
	$scope.addData = function (type) {
		$scope.item.data.push({
			key: type
		});
	};
};

app.controller('PersonEditCtrl', function ($scope, $stateParams, api) {
	$scope.modename = 'Person';
	$scope.isPerson = true;
	typedEditCtrl($scope, $stateParams, api);
});

app.controller('OrganisationEditCtrl', function ($scope, $stateParams, api) {
	$scope.modename = 'Organisation';
	$scope.isPerson = false;
	typedEditCtrl($scope, $stateParams, api);
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