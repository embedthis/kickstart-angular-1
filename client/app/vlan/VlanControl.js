/*
    Vlan Controller
 */

'use strict';

angular.module('app').controller('VlanControl', function (Esp, Vlan, $modal, $rootScope, $scope, $location, $routeParams) {
    angular.extend($scope, $routeParams);
    $scope.options = {
        mode: {
            "Online": "Online",
            "Offline": "Offline",
        },
    };

    if ($scope.id) {
        Vlan.get({id: $scope.id}, $scope, function(response) {
            $scope.vlan.num = $scope.vlan.name.replace('vlan', '');
        });
        if ($location.path().indexOf("ports") > 0) {
            Vlan.mappings({id: $scope.id}, $scope, {mappings: "data"});
        }
    } else if ($location.path() == "/vlan/") {
        Vlan.init(null, $scope);
    } else {
        Vlan.list(null, $scope, {vlans: "data"});
    }

    $scope.remove = function(id) {
        var confirm = $modal.open({
            scope: $scope,
            templateUrl: 'app/vlan/vlan-remove-confirm.html'
        });
        angular.forEach($scope.vlans, function(value, key) {
            if (value.id == id) {
                $scope.vlan = value;
            }
        })
        confirm.result.then(function(result) {
            if (result) {
                Vlan.remove({id: id}, function(response) {
                    Vlan.list(null, $scope, {vlans: "data"});
                    $location.path("/vlan/list");
                });
            }
        });
    };

    $scope.save = function() {
        $scope.vlan.name = 'vlan' + $scope.vlan.num;
        Vlan.update($scope.vlan, $scope, function(response) {
            if (!response.error) {
                $location.path('/vlan/list');
            }
        });
    };

    $scope.selectPane = function(pane) {
        $scope.currentPane = pane;
        if (pane == 'Details') {
            $location.path('/vlan/' + $scope.vlan.id);
        } else {
            $location.path('/vlan/' + $scope.vlan.id + '/ports');
        }
    };

    $scope.addPort = function(port) {
        Vlan.addPort({id: $scope.vlan.id, port: port}, $scope, function(response) {
            $rootScope.feedback = response.feedback;
            if (!response.error) {
                $location.path('/vlan/' + $scope.vlan.id + '/ports');
            }
        });
    };

    $scope.removePort = function(mapping) {
        $scope.port = { name: mapping['port.name'] };
        var confirm = $modal.open({
            scope: $scope,
            templateUrl: 'app/vlan/vlan-remove-port-confirm.html', 
        });
        confirm.result.then(function(result) {
            if (result) {
                Vlan.removePort({id: $scope.vlan.id, port: mapping['port.name']}, $scope, function(response) {
                    if (!response.error) {
                        $rootScope.feedback.inform = "Removed Port Mapping";
                        $location.path('/vlan/' + $scope.vlan.id + '/ports');
                        /* Update the new mapping list */
                        Vlan.mappings({id: $scope.id}, $scope, {mappings: "data"});
                    }
                });
            }
        });
    };
});

angular.module('app').config(function($routeProvider) {
    var Default = {
        controller: 'VlanControl',
        abilities: { edit: 'true', 'view': true },
        resolve: { action: checkAuth },
    };
    $routeProvider.when('/vlan/list', angular.extend({}, Default, {
        templateUrl: '/app/vlan/vlan-list.html',
        abilities: { 'view': true },
    }));
    $routeProvider.when('/vlan/:id', angular.extend({}, Default, {templateUrl: '/app/vlan/vlan-edit.html'}));
    $routeProvider.when('/vlan/:id/ports', angular.extend({}, Default, {templateUrl: '/app/vlan/vlan-ports.html'}));
    $routeProvider.when('/vlan/:id/add', angular.extend({}, Default, {templateUrl: '/app/vlan/vlan-add-port.html'}));
});
