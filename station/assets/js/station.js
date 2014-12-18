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

app.factory('entities', function ($resource) {
	'use strict';
	return $resource('/api/entity/:cmd', {
			apikey: 'ffalt'
		}, {
			list: {
				method: 'GET',
				params: {cmd: 'list', type: 'person'},
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


app.controller('PersonsCtrl', function ($scope, $resource, $filter, ngTableParams, entities) {
	'use strict';

	var persons = [];

	var getData = function ($defer, params) {
		var orderedData = params.filter() ?
			$filter('filter')(persons, params.filter()) :
			persons;
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

	entities.list({},
		function (data) {
			persons = data.result;
			$scope.tableParams.reload();
		},
		function (err) {
			console.error(err);
		}
	);

});

app.controller('OrganisationsCtrl', [function () {

}]);