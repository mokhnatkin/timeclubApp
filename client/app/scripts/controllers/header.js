'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('HeaderCtrl', ['$scope', '$state', 'authService', '$location','localStorageService','$rootScope',
  function ($scope, $state, authService, $location, localStorageService, $rootScope) {
    $scope.logout = function() {
        authService.logout().then(function (response) {
            $location.path('/login');
            localStorageService.clearAll();            
        }, function (err) {            
            console.log(err);
        });
    };

    $scope.stateReload = function() {//reloads current state
        $state.reload();
    };
    
    $scope.isCurrentUserAnAdmin = $rootScope.isAdmin;
    $scope.isCollapsed = true;
    $scope.collapse = function(){
        $scope.isCollapsed = !$scope.isCollapsed;        
    };

  }]);