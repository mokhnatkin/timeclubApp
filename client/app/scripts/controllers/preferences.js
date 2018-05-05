'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:PreferencesCtrl
 * @description
 * # PreferencesCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('PreferencesCtrl', ['$scope','promotionFactory','$state','authService','staffFactory','roleFactory','roleMappingFactory','$rootScope','roleDetails','msgService','textConsts','emplFactory',
  function ($scope, promotionFactory, $state, authService, staffFactory,roleFactory,roleMappingFactory,$rootScope,roleDetails,msgService,textConsts,emplFactory) {
    $scope.showInfo = false;
    $scope.showEmps = false;
    $scope.defaultRoleForNewUsers = textConsts.getDefaultRoleForNewUsers();
    $scope.message = msgService.getMsg("cannotQueryData");
    $scope.promotionTypes = textConsts.getPromotionTypes();
   
    $scope.consts = textConsts.getConstArr();//show constants  

    $scope.showChangeButton = true;

    emplFactory.query(  //fetch employees from the REST server      
      function(response) {
        $scope.employees = response;
        $scope.showEmps = true;
        },
      function(response) {
        $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
        window.alert("emplFactory: "+msgService.getMsg("cannotQueryData"));
      });
    
    $scope.showPromos = false;
    promotionFactory.query(  //fetch promotions from the REST server      
      function(response) {
        $scope.promotions = response;
        $scope.showPromos = true;
        },
      function(response) {
        $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
        window.alert("promotionFactory: "+msgService.getMsg("cannotQueryData"));
      });

    $scope.showUsers = false;
    roleFactory.query(  //fetch Roles from the REST server
         function(response) {
           $scope.roles = response;
           for(var i = 0; i < $scope.roles.length; i++){
             if($scope.roles[i].name == $scope.defaultRoleForNewUsers){//default user role
               $scope.selectedRole = $scope.roles[i];
              };
           };          
           roleMappingFactory.query(  //fetch RoleMappings from the REST server      
             function(response) {
               $scope.roleMapping = response;                            
               staffFactory.query(  //fetch users from the REST server
                 function(response) {
                   $scope.staffs = response; //all users are now in this array
                   $scope.showUsers = true;
                   },
                 function(response) {
                   window.alert("staffFactory: "+msgService.getMsg("cannotQueryData"));
                 });
             },
             function(response) {          
               window.alert("roleMappingFactory: "+msgService.getMsg("cannotQueryData"));
             });          
         },
         function(response) {          
           window.alert("roleFactory: "+msgService.getMsg("cannotQueryData"));
    });

    $scope.newPromotion = new promotionFactory();

    $scope.addPromotion = function(){//add new promotion
      if($rootScope.isAdmin){
        $scope.newPromotion.isActive = true;
        for (var i = 0; i < $scope.promotionTypes.length; i++){
          if ($scope.promotionTypes[i].desc == $scope.newPromotion.typeDesc) {
            $scope.newPromotion.type = $scope.promotionTypes[i].type;
          };
        };
        promotionFactory.create($scope.newPromotion, function() {   //save new guest
            $scope.newPromotion = {};
            $scope.showAddPromotionModal = !$scope.showAddPromotionModal;  //hide Add guest modal          
          },
          function()
            {window.alert("promotionFactory: "+msgService.getMsg("cannotSaveRecord"));}
        );
        $state.reload(); //update the list of promotions
      } else { //not admin
        $scope.cancelAddingPromotion();
        window.alert(msgService.getMsg("adminRoleNeeded"));
      };
    };

    $scope.toggleAddPromotionModal = function(){ //toggle Add promotion modal
      $scope.showAddPromotionModal = !$scope.showAddPromotionModal;
    };

    $scope.cancelAddingPromotion = function(){ //cancel Adding guest - clear fields and hide the modal
      $scope.newPromotion = {};
      $scope.showAddPromotionModal = !$scope.showAddPromotionModal;      
    };

    $scope.ToggleIsActiveFlagPromotion = function(){//activate or deactivate
      $scope.promoSelected = false;//is there any promo selected?
      var N;
      N = $scope.promotions.length;
      for (var i = 0; i < N; i++){
        $scope.promoSelected = $scope.promoSelected || $scope.promotions[i].isSelected;//is there any promo selected?
      };//end for
      if ($scope.promoSelected) {
        if($rootScope.isAdmin){
          for (i = 0; i < N; i++){
            if ($scope.promotions[i].isSelected){
              $scope.promotions[i].isActive = !$scope.promotions[i].isActive;//toggle isActive flag
              $scope.promotions[i].isSelected = !$scope.promotions[i].isSelected;
              promotionFactory.update({id: $scope.promotions[i].id}, $scope.promotions[i], function() {
                $state.reload(); //update the list of promotions
                  },
                    function(){
                      $state.reload();
                      console.log(response.status+ "; "+response.statusText);
                      window.alert("promotionFactory: "+msgService.getMsg("cannotUpdageRecord"));
                    }
              );
            };//end if
          };
        } else {
          window.alert(msgService.getMsg("adminRoleNeeded"));
        };
      } else {window.alert(msgService.getMsg("selectTheRowToChange"));};      
    };

    $scope.selectedRole = {};//empty object for role to be selected when adding user
    $scope.newRoleMapping = new roleMappingFactory();

    $scope.register = function(){//creates new user
        if($rootScope.isAdmin){
          var created = new Date();
          if (this.password === this.passwordConf) {
              authService.register(this.email, this.password, created).then(function (response) {
                //now save RoleMapping for new user              
                $scope.newRoleMapping.principalType="USER";
                $scope.newRoleMapping.principalId=response.id;//response.id contains user id
                $scope.newRoleMapping.roleId=$scope.selectedRole.id;              
                roleMappingFactory.create($scope.newRoleMapping, function() {   //save new guest
                  $scope.newRoleMapping = {};               
                  },
                  function()
                    {window.alert("roleMappingFactory: "+msgService.getMsg("cannotSaveRecord"));}
                );
                $scope.showAddUserModal = !$scope.showAddUserModal;
                //window.alert("Новый пользователь создан.");
                $state.reload();            
            }, function (err) {
                console.log(err);
                window.alert("authService: "+msgService.getMsg("cannotSaveRecord"));            
            });
          } else {
            this.passwordConf = "";
            window.alert(msgService.getMsg("passwordIsNotConfirmed"));
          };
        } else {
          $scope.cancelAddingUser();
          window.alert(msgService.getMsg("adminRoleNeeded"));
        };
    };

    
    $scope.showAddEmployeeModal = false;
    $scope.toggleAddEmployeeModal = function(){ //toggle Add employee modal
        $scope.showAddEmployeeModal = !$scope.showAddEmployeeModal;
    };

    $scope.cancelAddingEmployee = function(){ //cancel Adding employee - clear fields and hide the modal
      $scope.newEmployee = {};
      $scope.showAddEmployeeModal = !$scope.showAddEmployeeModal;      
    };

    $scope.newEmpl = {};
    $scope.addNewEmpl= function(){//put new employee to DB
      if($rootScope.isAdmin){
        emplFactory.create($scope.newEmpl, function() {   //save new employee
            $scope.newEmpl = {};
            $scope.showAddEmployeeModal = !$scope.showAddEmployeeModal;  //hide Add employee modal          
          },
          function()
            {window.alert("emplFactory: "+msgService.getMsg("cannotSaveRecord"));}
        );
        $state.reload(); //update the list of employess
      } else { //not admin
        $scope.cancelAddingEmployee();
        window.alert(msgService.getMsg("adminRoleNeeded"));
      };
    };

    $scope.deleteEmpl = function(){//delete employee
      if($rootScope.isAdmin){
        $scope.emplSelected = false;//is there any user selected?
        var N, emplToDeleteId;          
        N = $scope.employees.length;
        //var roleDetailsInfo = {};        
        for (var i = 0; i < N; i++){
          $scope.emplSelected = $scope.emplSelected || $scope.employees[i].isSelected;//is there any promo selected?
        };//end for
        if ($scope.emplSelected) {
          if (window.confirm("Подтвердите удаление") == true) {
            for (i = 0; i < N; i++){
              if ($scope.employees[i].isSelected){
                emplToDeleteId = $scope.employees[i].id;
                emplFactory.remove({id: emplToDeleteId}, function() {
                  $state.reload(); //update                 
                  },
                  function(){
                    window.alert("staffFactory: "+msgService.getMsg("cannotDeleteRecord"));
                  });                
              };//end if
            };//end for
          } else { //removing is not confirmed
            for (i = 0; i < N; i++){ 
              $scope.employees[i].isSelected = false;}
            }            
        } else {window.alert(msgService.getMsg("selectTheRowToDelete"));};
      } else {window.alert(msgService.getMsg("adminRoleNeeded"));};
    };

    $scope.showAddUserModal = false;
    $scope.toggleAddUserModal = function(){ //toggle Add guest modal
        $scope.showAddUserModal = !$scope.showAddUserModal;
    };
  
    $scope.cancelAddingUser = function(){ //cancel Adding guest - clear fields and hide the modal
        $scope.newUser = {};
        $scope.showAddUserModal = !$scope.showAddUserModal;      
    };

    $scope.DeleteUser = function(){
        if($rootScope.isAdmin){
          $scope.userSelected = false;//is there any user selected?   
          var N, userToDeleteId;          
          N = $scope.staffs.length;
          var roleDetailsInfo = {};
          
          for (var i = 0; i < N; i++){
            $scope.userSelected = $scope.userSelected || $scope.staffs[i].isSelected;//is there any promo selected?
          };//end for
          if ($scope.userSelected) {
            if (window.confirm("Подтвердите удаление") == true) {
              for (i = 0; i < N; i++){
                if ($scope.staffs[i].isSelected){
                  userToDeleteId = $scope.staffs[i].id;                  
                  roleDetailsInfo = roleDetails.getRoleDetailsByUserId(userToDeleteId,$scope.roleMapping,$scope.roles);
                  if(roleDetailsInfo.roleName == $rootScope.adminRoleName){
                    window.alert(msgService.getMsg("cannotDeleteAdminUser"));
                  } else {
                 //remove user                  
                  staffFactory.remove({id: userToDeleteId}, function() {
                        if (roleDetailsInfo.roleMappingId!="" || roleDetailsInfo.roleMappingId!='undefined'){ //check if RoleMappings exists
                          roleMappingFactory.remove({id: roleDetailsInfo.roleMappingId}, function() {                           
                          },
                          function(){window.alert("roleMappingFactory: "+msgService.getMsg("cannotDeleteRecord"));}
                          );
                        } else {$state.reload();};//no RoleMapping for this user
                    $state.reload(); //update                 
                    },
                    function(){
                      window.alert("staffFactory: "+msgService.getMsg("cannotDeleteRecord"));
                    });
                  }; 
                };//end if
              };//end for
            } else { //removing is not confirmed
              for (i = 0; i < N; i++){ 
                $scope.staffs[i].isSelected = false;}//msgService.getMsg("selectTheRowToDelete")
              }            
          } else {window.alert(msgService.getMsg("selectTheRowToDelete"));};
        } else {window.alert(msgService.getMsg("adminRoleNeeded"));};
    };

    $scope.ShowUserRole = function(userId){
      return roleDetails.getRoleDetailsByUserId(userId,$scope.roleMapping,$scope.roles).roleName;
    };
  }]);