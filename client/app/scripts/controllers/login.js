'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('LoginCtrl', ['$scope', '$state', 'authService', '$location','$rootScope','roleFactory','roleMappingFactory','roleDetails','staffFactory','userDetails','localStorageService','msgService',
    function ($scope, $state, authService, $location,$rootScope,roleFactory,roleMappingFactory,roleDetails,staffFactory,userDetails,localStorageService,msgService) {

    $scope.login = function () {
        authService.login(this.username, this.password).then(function (response) {
            //Logged in succesfully            
            $rootScope.currentUserId = response.userId;            
            roleFactory.query(  //fetch Roles from the REST server      
                function(response) {
                  $scope.roles = response;      
                  roleMappingFactory.query(  //fetch RoleMappings from the REST server      
                    function(response) {
                        $scope.roleMapping = response;
                        $rootScope.currentUserRole = roleDetails.getRoleDetailsByUserId($rootScope.currentUserId,$scope.roleMapping,$scope.roles).roleName;                        
                        if ($rootScope.currentUserRole==$rootScope.adminRoleName){//set admin flag
                            $rootScope.isAdmin = true;
                        } else {$rootScope.isAdmin = false;};
                        staffFactory.query(  //fetch users from the REST server
                            function(response) {
                              $scope.staffs = response; //all users are now in this array
                              $rootScope.currentUserName=userDetails.getUserNameByUserId($rootScope.currentUserId,$scope.staffs);
                              //console.log("Logged in; currentUserId: "+$rootScope.currentUserId+"; currentUserName="+$rootScope.currentUserName+"; currentUserRole="+$rootScope.currentUserRole+"; isAdmin="+$rootScope.isAdmin);
                              localStorageService.clearAll();
                              if(localStorageService.isSupported) { //save user details to local storage
                                localStorageService.set("currentUserId", $rootScope.currentUserId);
                                localStorageService.set("currentUserName", $rootScope.currentUserName);
                                localStorageService.set("currentUserRole", $rootScope.currentUserRole);
                                localStorageService.set("isAdmin", $rootScope.isAdmin);
                                //console.log("user details saved to local storage");                                                             
                              };
                              $location.path('/');
                            },
                            function(response) {//msgService.getMsg("cannotQueryData")
                              window.alert("staffFactory: "+msgService.getMsg("cannotQueryData"));
                            });                        
                    },
                    function(response) {
                        console.log("roleMappingFactory: "+msgService.getMsg("cannotQueryData"));
                    });          
                },
                function(response) {          
                    console.log("roleFactory: "+msgService.getMsg("cannotQueryData"));
            });            
        }, function (err) {
            //fail to log in            
            window.alert(msgService.getMsg("cannotLogin"));
        });
    };

    $scope.cancelLogin = function () {
        $scope.username = "";
        $scope.password = "";        
    };

  }]);