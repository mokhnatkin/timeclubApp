'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:CheckoutCtrl
 * @description
 * # CheckoutCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('CheckoutCtrl', ['$scope','checkoutService','clientFactory','guestFactory','guestCompute','promotionFactory','$state','$timeout','checkoutFactory','msgService','convertMMtoDDHHMM',
  function ($scope,checkoutService,clientFactory,guestFactory,guestCompute,promotionFactory,$state,$timeout,checkoutFactory,msgService,convertMMtoDDHHMM) {
    var N, checkoutDateTime;
    $scope.isPaidButtonActive = false;

    promotionFactory.query(
        function(response) {
          $scope.deleteCheckouts();//now remove all old records from checkoutFactory
          $scope.promotions = response;
          $scope.guestsToCheckout = checkoutService.fetchArr();
          checkoutDateTime = checkoutService.fetchDateTime();
          N = $scope.guestsToCheckout.length;
          $scope.totalN = N;
          $scope.guestsToCheckout = guestCompute.modifyGuestArr($scope.guestsToCheckout,$scope.promotions,checkoutDateTime);
          $scope.amountCheckout = 0;
          for (var i = 0; i < N; i++){
              $scope.amountCheckout = $scope.amountCheckout + $scope.guestsToCheckout[i].amount;
              $scope.guestsToCheckout[i].checkoutTime = checkoutDateTime;        
          };          
          //now save all new checkouts
          var newCheckout = new checkoutFactory();
          for (var m = 0; m < N; m++){
                newCheckout = {};
                newCheckout.name = $scope.guestsToCheckout[m].name;
                newCheckout.promotion = $scope.guestsToCheckout[m].promotion;
                newCheckout.arrivalTime = $scope.guestsToCheckout[m].arrivalTime;
                newCheckout.checkoutTime = $scope.guestsToCheckout[m].checkoutTime;
                newCheckout.timeInClub = $scope.guestsToCheckout[m].timeInClub;
                newCheckout.amount = $scope.guestsToCheckout[m].amount;
                newCheckout.isFree = $scope.guestsToCheckout[m].isFree;
                newCheckout.isEmployee = $scope.guestsToCheckout[m].isEmployee;
                checkoutFactory.create(newCheckout, function(){
                    newCheckout = {};//saved sucessfully
                },
                    function(){console.log("checkoutFactory: "+msgService.getMsg("cannotSaveRecord"));}
                );
            };
        },
        function(response) {console.log("promotionFactory: "+msgService.getMsg("cannotQueryData"));}
    );

    $scope.deleteCheckouts = function(){
        checkoutFactory.query(  //fetch guests from the REST server
            function(response) {
                var newCheckouts = response;
                for (var k = 0; k < newCheckouts.length; k++){
                checkoutFactory.remove({id: newCheckouts[k].id}, function() {
                    //Removed sucessfully
                    },
                    function(){
                        console.log("checkoutFactory: "+msgService.getMsg("cannotDeleteRecord"));
                        }
                    );
                }
            },
            function(){
                console.log("checkoutFactory: "+msgService.getMsg("cannotQueryData"));
        });
    };

    $scope.checkoutGuests = function(){
        for (var i = 0; i < N; i++){//for each guest to check out - save to History
            $scope.guestsToCheckout[i].isActive = false;
            $scope.guestsToCheckout[i].isChecked = false;
            $scope.newClient = new clientFactory(); //new empty client object
            $scope.newClient = $scope.guestsToCheckout[i];
            //now save newClient object to DB
            clientFactory.create($scope.newClient, function(){
                //saved sucessfully
              },
              function(){window.alert("clientFactory: "+msgService.getMsg("cannotSaveRecord"));}
            );
            //now remove guests from the list
            guestFactory.remove({id: $scope.guestsToCheckout[i].id}, function() {
                //Removed sucessfully
                },
                function(){
                    window.alert("guestFactory: "+msgService.getMsg("cannotDeleteRecord"));
                }
            );
        }; //end of FOR loop
        $scope.isPaidButtonActive = true;
    };

    $scope.cancleCheckoutGuests = function(){
        $scope.deleteCheckouts();
        $state.go("app", {}, { reload: true });
    };

    $scope.closeCheckoutWindow = function(){
    //close the dialog window
        $scope.deleteCheckouts();
        $state.go("app", {}, { reload: true });
    };

    $scope.convertMinutes = function(minutes){//convert timeinClub (minutes) into dd, hh, mm
        var res = convertMMtoDDHHMM.convertMinutes(minutes);
        return res;
      };
}]);