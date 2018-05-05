'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('DashboardCtrl', ['$scope','guestFactory','guestCompute','clientFactoryFiltered','promotionFactory','$rootScope','msgService','serverTimeFactory',
  function ($scope,guestFactory,guestCompute,clientFactoryFiltered,promotionFactory,$rootScope,msgService,serverTimeFactory) {
    $scope.showInfo = false;
    $scope.message = msgService.getMsg("loadingInProgress");
    $scope.guestsModified = [];  
    var currentTimeServer;

    serverTimeFactory.get(//trying fetch date and time from server
        function(response) {
            currentTimeServer = response;//date&time from server  
            //currentTimeServerDDTT = currentTimeServer.currentDateTime;          
            $scope.startDateToday = new Date(currentTimeServer.currentDateTime);
            $scope.endDate = $scope.startDateToday;
            $scope.doDBFetch();
        },
        function(response) {      
            $scope.startDateToday = new Date();//if fails, use local machine date & time
            $scope.endDate = $scope.startDateToday;
            $scope.doDBFetch();
            console.log("serverTimeFactory: "+msgService.getMsg("cannotQueryData"));          
        });



    $scope.doDBFetch = function(){//fetch data after time is obtained from server
        $scope.startDate = guestCompute.computeStartDateThisDay($scope.startDateToday,$rootScope.currentUserRole);
        $scope.startDate2 = guestCompute.computeStartDateThisMonth($scope.startDateToday);
        
        guestFactory.query(//stat for Now in the club
            function(response) {
                $scope.guests = response;
                $scope.showInfo = true;
                promotionFactory.query(
                    function(response) {
                        $scope.promotions = response;
                        $scope.guestsModified = guestCompute.modifyGuestArr($scope.guests,$scope.promotions,$scope.endDate);
                        $scope.outStatNow = guestCompute.computeGuestStat($scope.guestsModified);
                    },
                        function(response) {console.log("promotionFactory: "+msgService.getMsg("cannotQueryData"));}
                    );
                },
            function(response) {
                $scope.message = response.status + " " + response.statusText;
                window.alert(msgService.getMsg("cannotQueryData")+$scope.message);
            });

        clientFactoryFiltered.query(//stat for club today
            {start:$scope.startDate,end:$scope.endDate},function(response) {
                $scope.clients = response;
                $scope.outStatToday = guestCompute.computeGuestStat($scope.clients);
            },
                function(response) {
                    $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
            });
                    
        clientFactoryFiltered.query(//stat for club this month
            {start:$scope.startDate2,end:$scope.endDate},function(response) {
                $scope.clients2 = response;
                $scope.outStatMonth = guestCompute.computeGuestStat($scope.clients2);
            },
                function(response) {
                    $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
            });
    };

  }]);
