'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:HistoryCtrl
 * @description
 * # HistoryCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('HistoryCtrl', ['$scope','clientFactoryFiltered','guestCompute','promotionFactory','promoDetails','rowColorsGuests','$state','clientFactory','$rootScope','activePromotionFactory','msgService','textConsts','convertMMtoDDHHMM','guestFactory','guestFilterFactory','emplFactory','serverTimeFactory',
  function ($scope,clientFactoryFiltered,guestCompute,promotionFactory,promoDetails,rowColorsGuests,$state,clientFactory,$rootScope,activePromotionFactory,msgService,textConsts,convertMMtoDDHHMM,guestFactory,guestFilterFactory,emplFactory,serverTimeFactory) {
    $scope.showClients = false;//show / hide table with clients
    $scope.message = msgService.getMsg("loadingInProgress");
    var companiesMaxNum = textConsts.getConstValueByName("companiesMaxNum");//max number of companies (groups)
    $scope.companies = [];
    for (var j = 0; j < companiesMaxNum; j++){
      $scope.companies[j] = j+1;//company number - for groups
    };

    ///////////////////////////////////////////////////////
    var currentTimeServer;
    serverTimeFactory.get(//trying fetch date and time from server
      function(response) {
          currentTimeServer = response;//date&time from server
          $scope.startDateToday = new Date(currentTimeServer.currentDateTime);
          $scope.endDate = $scope.startDateToday;
          $scope.maxDate = $scope.startDateToday;
          $scope.startDate = guestCompute.computeStartDateThisDay($scope.startDateToday,$rootScope.currentUserRole);
          $scope.getDatesAndFetchClients($scope.startDate,$scope.endDate);
      },
      function(response) {
          $scope.startDateToday = new Date();//if fails, use local machine date & time
          $scope.endDate = $scope.startDateToday;
          $scope.maxDate = $scope.startDateToday;
          $scope.startDate = guestCompute.computeStartDateThisDay($scope.startDateToday,$rootScope.currentUserRole);
          $scope.getDatesAndFetchClients($scope.startDate,$scope.endDate);
          console.log("serverTimeFactory: "+msgService.getMsg("cannotQueryData"));
      });

    ///////////////////////////////////////////////////////
    $scope.promotions=[];
    $scope.activePromotions=[];

    promotionFactory.query(
      function(response) {
        $scope.promotions = response;
      },
      function(response) {console.log("promotionFactory: "+msgService.getMsg("cannotQueryData"));
    });

    activePromotionFactory.query(
      function(response) {
        $scope.activePromotions = response;
      },
      function(response) {console.log("activePromotionFactory: "+msgService.getMsg("cannotQueryData"));
    });

    ///////////////////////////////////////////////////////

    $scope.employees = [];
    emplFactory.query(//fetch employees from the REST server
        function(response) {
          $scope.employees = response;
          },
        function(response) {
          $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
          window.alert("emplFactory: "+msgService.getMsg("cannotQueryData"));
        });

    ///////////////////////////////////////////////////////

    $scope.getPromoNameById = function(promoId){
      var promoName;
      promoName = promoDetails.getNameById(promoId,$scope.promotions);
      return promoName;
    };

    $scope.setRowBackgroud = function(isFree,promotion,isEmployee){//set background color to row depending on free guest att and promotion
      var rowClass;
      rowClass = rowColorsGuests.setRowColor(isFree,promotion,isEmployee);
      return rowClass;
    };

    $scope.disableIsFreeED = false;
    $scope.disablePromoSelectED = true;

    $scope.changeIsFreeFlagByPromo = function(guestPromoId,type,guestIndex){
      //if Birthday or any promo with 0 fix amount, then activate is Free flag
      var result = false;
      var isBirthday = guestCompute.isSelectedPromoBirthday(guestPromoId,$scope.promotions);
      if (isBirthday){
          $scope.disableIsFreeED = true;
          $scope.disablePromoSelectED = false;
          result = true;
      } else {
          $scope.disableIsFreeED = false;
          $scope.disablePromoSelectED = true;
          result = false;
      };
      return result;
    };

    $scope.removePromoIfFree = function(isFree,promotion){//if isFree checked, then remove promo id
      var newPromo;
      if(isFree){
        newPromo = null;
      } else {newPromo = promotion;};
      return newPromo;
    };

    ///////////////////////////////////////////////////////
    var N; //total nubmer of clients displayed
    $scope.getDatesAndFetchClients = function(startDate,endDate){
      if(endDate<startDate){
          window.alert(msgService.getMsg("validateDatesBegEnd"));
        } else {
          clientFactoryFiltered.query(  //fetch clients from the REST server; only those clients whose checkoutTime is between :start and :end
            {start:startDate,end:endDate},function(response) {
              $scope.clients = response; //clients are now in this array: clients
              N = $scope.clients.length;
              $scope.showClients = true;
              $scope.search = '';
              $scope.outStat = guestCompute.computeGuestStat($scope.clients);
              },
            function(response) {
              $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
            });
        };
    };

    ///////////////////////////////////////////////////////

    $scope.isCurrentUserAnAdminUser = $rootScope.isAdmin;
    $scope.showEditGuestModal = false;
    $scope.showChangeButton = true;

    $scope.guestToBackToMain = {};//empty object - guest to push back to main
    $scope.backToMain = function(){//back to Main page (remove from client, add to guests)
      if($rootScope.isAdmin){
        var guestSelected = false;//is there any guest selected for check-out?
        var countSelected = 0;
        var i,k,confR;
        for (i = 0; i < N; i++){
          guestSelected = guestSelected || $scope.clients[i].isChecked;//is there any guest selected for check-out?
          if ($scope.clients[i].isChecked){
            countSelected++;//this array stores guests to check out
            k=i;
          };
        };
        if (guestSelected) {//at least one guest is selected
          if (countSelected == 1){//1 guest is selected
            $scope.showChangeButton = false;
            $scope.clients[k].isChecked = false;
            //$scope.guestToBackToMain = $scope.clients[k];
            $scope.guestToBackToMain.name = $scope.clients[k].name;
            $scope.guestToBackToMain.arrivalTime = $scope.clients[k].arrivalTime;
            $scope.guestToBackToMain.checkoutTime = null;
            $scope.guestToBackToMain.amount = 0;
            $scope.guestToBackToMain.isFree = $scope.clients[k].isFree;
            $scope.guestToBackToMain.promotion = $scope.clients[k].promotion;
            $scope.guestToBackToMain.comment = $scope.clients[k].comment;
            $scope.guestToBackToMain.isActive = $scope.clients[k].isActive;
            $scope.guestToBackToMain.isChecked = $scope.clients[k].isChecked;
            $scope.guestToBackToMain.timeInClub = 0;
            $scope.guestToBackToMain.isEmployee = $scope.clients[k].isEmployee;
            $scope.guestToBackToMain.isEmployeeAtWork = $scope.clients[k].isEmployeeAtWork;
            $scope.guestToBackToMain.companyN = $scope.clients[k].companyN;
            $scope.guestToBackToMain.isDirector = $scope.clients[k].isDirector;            
            
            //$scope.guestToBackToMain.timeInClub = 0;//in order to refresh
            //$scope.guestToBackToMain.amount = 0;//in order to refresh
            //$scope.guestToBackToMain.checkoutTime = null;//in order to refresh
            //show confirmation window
            confR = window.confirm(msgService.getMsg("confirmBackToMain"));
            if (confR){//confirmed
              //create a new guest
              guestFactory.create($scope.guestToBackToMain, function() {//save the guest
                clientFactory.remove({id: $scope.clients[k].id}, function() {//remove the client
                  //Removed sucessfully
                  $scope.guestToBackToMain = {};
                  $state.reload();
                  $scope.showChangeButton = true;
                  },
                  function(){
                      window.alert(msgService.getMsg("cannotDeleteRecord"));
                  }
                );
              },
              function()
                {window.alert(msgService.getMsg("cannotSaveRecord"));}
              );
            } else {//not confirmed
              $scope.cancelBackToMain();
            };
            } else {window.alert(msgService.getMsg("selectJustOneRow"));}
          }
          else {
            window.alert(msgService.getMsg("selectTheRowToChange"));
          };
      } else {window.alert(msgService.getMsg("adminRoleNeeded"));};
    };

    $scope.cancelBackToMain = function(){//cancel - do not push guest back to main
      //cancel - do not edit guest
      $scope.guestToBackToMain = {};
      $scope.showChangeButton = true;
    };

    ///////////////////////////////////////////////////////

    $scope.guestToEdit = {};//empty object - guest to edit
    $scope.editGuests = function(){//edit a guest in the club
      if($rootScope.isAdmin){
        var guestSelected = false;//is there any guest selected for check-out?
        var countSelected = 0;
        var i,k;
        for (i = 0; i < N; i++){
          guestSelected = guestSelected || $scope.clients[i].isChecked;//is there any guest selected for check-out?
          if ($scope.clients[i].isChecked){
            countSelected++;//this array stores guests to check out
            k=i;
          };
        };
        var isBirthday;
        if (guestSelected) {//at least one guest is selected
          if (countSelected == 1){
            //show form to update guest
            $scope.showChangeButton = false;
            $scope.clients[k].isChecked = false;
            $scope.guestToEdit = $scope.clients[k];
            isBirthday = guestCompute.isSelectedPromoBirthday($scope.guestToEdit.promotion,$scope.promotions);
            if(!isBirthday) {
              $scope.disablePromoSelectED = true;
              $scope.disableIsFreeED = false;
            } else {
              $scope.disablePromoSelectED = false;
              $scope.disableIsFreeED = true;
            };
            $scope.showEditGuestModal = true;
            } else {window.alert(msgService.getMsg("selectJustOneRow"));}
          }
          else {
            window.alert(msgService.getMsg("selectTheRowToChange"));
          };
      } else {window.alert(msgService.getMsg("adminRoleNeeded"));};
    };

    $scope.postChangesToGuest = function(){
      var currentTimeServer, todayDate;
      serverTimeFactory.get(//trying fetch date and time from server
        function(response) {
            currentTimeServer = response;//date&time from server
            todayDate = new Date(currentTimeServer.currentDateTime);
            $scope.postChangesToGuestToDB(todayDate);
        },
        function(response) {
            todayDate = new Date();//if fails, use local machine date & time
            $scope.postChangesToGuestToDB(todayDate);
            console.log("serverTimeFactory: "+msgService.getMsg("cannotQueryData"));
        });
    };

    $scope.postChangesToGuestToDB = function(todayDate){
      //tries to change guest's attrs
      var timeDelta = Math.abs(Date.parse(todayDate) - Date.parse($scope.guestToEdit.checkoutTime));
      var isToday = false;
      var guestsToEdit =[];
      if(timeDelta<=$rootScope.oneDayInMSec){//user tries to change guest who checked out today?
        isToday = true;
      };
      if(isToday){//post changes to DB - guest left within 24 hours
        $scope.guestToEdit = guestCompute.actualizateGuest($scope.guestToEdit,$scope.promotions);
        guestsToEdit[0] = $scope.guestToEdit;
        guestsToEdit = guestCompute.modifyGuestArr(guestsToEdit,$scope.promotions,todayDate);
        for (var m = 0; m < guestsToEdit.length; m++){
          $scope.newClient = new clientFactory();//new empty client object
          $scope.newClient = guestsToEdit[0];
          clientFactory.update({id:  $scope.newClient.id},  $scope.newClient, function() {
            //updated
            $state.reload();
            },
            function(){
              window.alert(msgService.getMsg("cannotUpdageRecord"));
            }
          );
        };
        $scope.showChangeButton = true;
      } else {
        window.alert(msgService.getMsg("cannotChangeOldHisotory"));
      };
    };

    $scope.cancelEditingGuest = function(){
      //cancel - do not edit guest
      $scope.guestToEdit = {};
      $scope.selectedPromoEdit = {};
      $scope.showEditGuestModal = false;
      $scope.showChangeButton = true;
      $state.reload();
    };

    ///////////////////////////////////////////////////////

    $scope.changeEmplIsDir = function(emplID){//returns isDirector when selecting employee from the list
      return guestCompute.changeEmplIsDir(emplID,$scope.employees);
    };

    $scope.changeEmplName = function(emplID){//what is employee's name?
     return guestCompute.changeEmplName(emplID,$scope.employees);
    };
    ///////////////////////////////////////////////////////

    $scope.convertMinutes = function(minutes){//convert timeinClub (minutes) into dd, hh, mm
      var res = convertMMtoDDHHMM.convertMinutes(minutes);
      return res;
    };

    ///////////////////////////////////////////////////////

    $scope.search = '';
    $scope.searchNameAndCompany = function(item){//custom filter: uses guest name and company name to filter
      var res;
      res = guestFilterFactory.searchGuestNameAndCompany(item,$scope.search);
      return res;
    };

     ///////////////////////////////////////////////////////
     $scope.computeSearchTotals = function(searchInput){//computes number of guests and amount when filter is applied
      var searchTotals=[];
      if(searchInput.length>0){
        searchTotals = guestFilterFactory.computeSearchTotals(searchInput,$scope.clients);
      };
      return searchTotals;
    };

    ///////////////////////////////////////////////////////



    //calendar settings from textConsts service
    $scope.hourStep = textConsts.getCalendarSetting("hourStep");
    $scope.minuteStep = textConsts.getCalendarSetting("minuteStep");
    $scope.format = textConsts.getCalendarSetting("format");
    $scope.dateOptions = {
      showWeeks: textConsts.getCalendarSetting("showWeeks"),
      startingDay: textConsts.getCalendarSetting("startingDay")
    };

  }]);
