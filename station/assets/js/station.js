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
		.state('edit', {
			url: "/edit/:id",
			templateUrl: "partials/edit.html",
			controller: 'EditCtrl'
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
	'use strict';
	typedListCtrl($scope, $resource, $filter, ngTableParams, api, 'entity');
});

app.controller('EditCtrl', function ($scope, $stateParams, api) {
	'use strict';
	console.log($stateParams);
	api.item({id: $stateParams.id},
		function (data) {
			$scope.item = data.result;
		},
		function (err) {
			console.log('err', err);
		}
	)

});