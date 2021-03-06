'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.factories
 * @description
 * # GuestsFactory and overs
 * Factories of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
    //constants baseURL and serverTimeURL for production mode    
    .constant("baseURL","http://194.87.99.245:3000/api/")
    .constant("serverTimeURL","http://194.87.99.245:3001/time")
    //constants baseURL and serverTimeURL for local development mode
    //.constant("serverTimeURL","http://0.0.0.0:3001/time")
    //.constant("baseURL","http://localhost:3000/api/")


    .factory('serverTimeFactory',['$resource','serverTimeURL',function($resource,serverTimeURL)//guests - in the club now
    {
            return $resource(serverTimeURL, {}, {
                get: { method: "GET"}
            });
    }])

    .factory('guestFactory',['$resource','baseURL',function($resource,baseURL)//guests - in the club now
    {
            return $resource(baseURL+"guests/:id", {}, {
                query: { method: "GET", isArray: true },
                create: { method: "POST"},
                get: { method: "GET"},
                remove: { method: "DELETE"},
                update: { method: "PUT"}
            });
    }])

    .factory('clientFactory',['$resource','baseURL',function($resource,baseURL)//clients - left the club and paid the bill
    {
            return $resource(baseURL+"clients/:id", {}, {
                query: { method: "GET", isArray: true },
                create: { method: "POST"},
                get: { method: "GET"},
                remove: { method: "DELETE"},
                update: { method: "PUT"}
            });
    }])

    .factory('clientFactoryFiltered',['$resource','baseURL',function($resource,baseURL)//clients - left the club and paid the bill
    { //select only those clients whose checkoutTime is between :start and :end
        return $resource(baseURL+"clients?filter[where][checkoutTime][between][0]=:start&filter[where][checkoutTime][between][1]=:end", {}, {
            query: { method: "GET", isArray: true }
        });
    }])

    .factory('employeeWagesFactory',['$resource','baseURL',function($resource,baseURL)//employees per period
    { //select only those clients whose checkoutTime is between :start and :end, and isEmployee flag is true, and isDirector is false
        return $resource(baseURL+"clients?filter[where][checkoutTime][between][0]=:start&filter[where][checkoutTime][between][1]=:end&filter[where][isEmployee]=:emplFlag&filter[where][isDirector]=:dirFlag", {}, {
            query: { method: "GET", isArray: true }
        });
    }])

    .factory('clientListFactory',['$resource','baseURL',function($resource,baseURL)//list of clients with mobile phones
    {
            return $resource(baseURL+"clientlists/:id", {}, {
                query: { method: "GET", isArray: true },
                create: { method: "POST"},
                get: { method: "GET"},
                remove: { method: "DELETE"},
                update: { method: "PUT"}
            });
    }])

    .factory('emplFactory',['$resource','baseURL',function($resource,baseURL)//users
    {
            return $resource(baseURL+"employees/:id", {}, {
                query: { method: "GET", isArray: true },
                create: { method: "POST"},
                get: { method: "GET"},
                remove: { method: "DELETE"},
                update: { method: "PUT"}
            });
    }])

    .factory('bookingFactory',['$resource','baseURL',function($resource,baseURL)//list of bookings
    {
            return $resource(baseURL+"bookings/:id", {}, {
                query: { method: "GET", isArray: true },
                create: { method: "POST"},
                get: { method: "GET"},
                remove: { method: "DELETE"},
                update: { method: "PUT"}
            });
    }])

    .factory('bookingFactoryToday',['$resource','baseURL',function($resource,baseURL)//today's bookings
    { //select only today's bookings
        return $resource(baseURL+"bookings?filter[where][date][between][0]=:start&filter[where][date][between][1]=:end", {}, {
            query: { method: "GET", isArray: true }
        });
    }])

    .factory('bookingFactoryTodayAndFuture',['$resource','baseURL',function($resource,baseURL)//today's bookings
    { //select only today's and future bookings
        return $resource(baseURL+"bookings?filter[where][date][gte]=:start", {}, {
            query: { method: "GET", isArray: true }
        });
    }])

    .factory('checkoutFactory',['$resource','baseURL',function($resource,baseURL)//guests - in the club now
    {
            return $resource(baseURL+"checkouts/:id", {}, {
                query: { method: "GET", isArray: true },
                create: { method: "POST"},
                get: { method: "GET"},
                remove: { method: "DELETE"},
                update: { method: "PUT"}
            });
    }])

    .factory('promotionFactory',['$resource','baseURL',function($resource,baseURL)//promotions
    {
            return $resource(baseURL+"promotions/:id", {}, {
                query: { method: "GET", isArray: true },
                create: { method: "POST"},
                get: { method: "GET"},
                remove: { method: "DELETE"},
                update: { method: "PUT"}
            });
    }])

    .factory('activePromotionFactory',['$resource','baseURL',function($resource,baseURL)//promotions
    {
            return $resource(baseURL+"promotions?filter[where][isActive]=true", {}, {
                query: { method: "GET", isArray: true }
            });
    }])

    .service('guestCompute',['$rootScope', 'textConsts', function($rootScope,textConsts)
    {
        this.modifyGuestArr = function(inArr,promotions,currentDateTime)//computes minutes in club and amount for each guest
        {
            var outArr = inArr;
            var N = inArr.length;
            var pricePerMinute = textConsts.getConstValueByName("pricePerMinute");
            var maxAmount = textConsts.getConstValueByName("maxAmount");
            for (var i = 0; i < N; i++) {
                var k, j, promoType, promoValue;
                k = 1;
                if(outArr[i].checkoutTime != null || outArr[i].checkoutTime != undefined){
                    outArr[i].timeInClub = Math.floor(Math.abs(Date.parse(outArr[i].arrivalTime)-Date.parse(outArr[i].checkoutTime))/60000);//time in the club
                } else {
                    outArr[i].timeInClub = Math.floor(Math.abs(Date.parse(outArr[i].arrivalTime)-Date.parse(currentDateTime))/60000);//time in the club};
                };
                if(outArr[i].isFree || outArr[i].isEmployee){//free guest or employee
                    outArr[i].amount = 0; //a free guest
                } else { //guest who pay
                    if (outArr[i].promotion != null || outArr[i].promotion != undefined) {//promotion
                        j = 0;
                        var notFound = true;
                        while(notFound){
                            if(promotions[j].id == outArr[i].promotion){
                                promoType = promotions[j].type;
                                promoValue = promotions[j].value;
                                notFound = false;
                            } else {
                                j++;
                                if(j>=promotions.length){
                                    notFound = false;//promotion not found
                                };
                            };
                        };
                        if (promoType == "fixAmount") {//fix amount promotion
                            outArr[i].amount = promoValue;
                        } else {
                            if (promoType == "fixDiscount") {
                                k=(1-promoValue/100);//discount promotion
                                outArr[i].amount = Math.min(k * pricePerMinute * outArr[i].timeInClub, k * maxAmount);//promotion applied; k for discount
                            } else {
                                outArr[i].amount = Math.min(pricePerMinute * outArr[i].timeInClub, maxAmount);//cannot determine promotion type - apply standard rate
                            };
                        };
                    } else {//standard guest
                        outArr[i].amount = Math.min(pricePerMinute * outArr[i].timeInClub, maxAmount);//amount to be paid KZT - standard rate
                    };
                };
            };
            return outArr;
        };

        this.computeGuestStat = function(inArr)//computes stat for a given period - N of guests, free / employees, amount etc.
        {
            var outArr = inArr;
            var N = inArr.length;
            var totalAmount = 0;
            var totalGuestsFree = 0;
            var totalNormalGuests = 0;
            var totalEmployees = 0;
            var totalGuests = 0;
            for (var i = 0; i < N; i++) {
                if (outArr[i].isEmployee) {
                    totalEmployees++;
                } else {
                    if (outArr[i].isFree){
                        totalGuestsFree++;
                    } else {totalAmount = totalAmount + outArr[i].amount;};
                };
            };
            var outStat = [];
            totalGuests = N-totalEmployees;
            totalNormalGuests = totalGuests-totalGuestsFree;//clients who pay
            outStat.push(N);//people in the club now
            outStat.push(totalEmployees);//employees
            outStat.push(totalGuests);//guests
            outStat.push(totalNormalGuests); //guests who pay
            outStat.push(totalGuestsFree);
            outStat.push(totalAmount); //total amount in the club now
            return outStat;
        };

        this.computeClientStat = function(inArr,promotions){//for Stat page
            var i,j;
            var N = inArr.length;
            var outStat = [];//array of all stat objects
            var totalN = N; var totalSum = 0; var totalAv;//Всего
            var employeesN = 0; var employeesSum = 0; var employeesAv//Сотрудники
            var employeesAtWorkN = 0; var employeesAtWorkSum = 0; var employeesAtWorkAv;//в смене
            var employeesAsGuestsN = 0; var employeesAsGuestsSum = 0; var employeesAsGuestsAv;//просто
            var guestsN = 0; var guestsSum = 0; var guestsAv;//Гости
            var guestsFreeN = 0; var guestsFreeSum = 0; var guestsFreeAv;//бесплатные
            var guestsNotFreeN = 0; var guestsNotFreeSum = 0; var guestsNotFreeAv;//платные
            var guestsStandN = 0; var guestsStandSum = 0; var guestsStandAv;//стандарт
            var guestsPromoN = 0; var guestsPromoSum = 0; var guestsPromoAv;//акции
            for (j = 0; j < promotions.length; j++) { //add all promotions to categories
                promotions[j].N = 0;
                promotions[j].Sum = 0;
            };
            for (i = 0; i < N; i++) {//for all clients in array
                var amount = inArr[i].amount;
                totalSum = totalSum + amount;
                if (inArr[i].isEmployee) {
                    employeesN++;
                    employeesSum = employeesSum + amount;
                    if(inArr[i].isEmployeeAtWork) {//employee at work
                        employeesAtWorkN++;
                        employeesAtWorkSum = employeesAtWorkSum + amount;
                    } else {//employee as a guest
                        employeesAsGuestsN++;
                        employeesAsGuestsSum = employeesAsGuestsSum + amount;
                    }
                } else { //not employee - guest
                    guestsN++;
                    guestsSum = guestsSum + amount;
                    if (inArr[i].isFree){//free guest
                        guestsFreeN++;
                        guestsFreeSum = guestsFreeSum + amount;
                    } else {//not a free guest
                        guestsNotFreeN++;
                        guestsNotFreeSum = guestsNotFreeSum + amount;
                        if (inArr[i].promotion == null || inArr[i].promotion == undefined)//standard - no promotion
                            {
                                guestsStandN++;
                                guestsStandSum = guestsStandSum + amount;
                            } else {//promotion in place
                                guestsPromoN++;
                                guestsPromoSum = guestsPromoSum + amount;
                                for (j = 0; j < promotions.length; j++) {//check for each promotion
                                    if (promotions[j].id == inArr[i].promotion){
                                        promotions[j].N++;
                                        promotions[j].Sum = promotions[j].Sum + amount;
                                    };
                                };
                            };
                        };
                    };
                };
            if (totalN != 0){
                totalAv = totalSum/totalN;
            };
            if (employeesN != 0){
                employeesAv = employeesSum/employeesN;
            };
            if (employeesAtWorkN != 0){
                employeesAtWorkAv = employeesAtWorkSum/employeesAtWorkN;
            };
            if (employeesAsGuestsN != 0){
                employeesAsGuestsAv = employeesAsGuestsSum/employeesAsGuestsN;
            };
            if (guestsN != 0){
                guestsAv = guestsSum/guestsN;
            };
            if (guestsFreeN != 0){
                guestsFreeAv = guestsFreeSum/guestsFreeN;
            };
            if (guestsNotFreeN != 0){
                guestsNotFreeAv = guestsNotFreeSum/guestsNotFreeN;
            };
            if (guestsStandN != 0){
                guestsStandAv = guestsStandSum/guestsStandN;
            };
            if (guestsPromoN != 0){
                guestsPromoAv = guestsPromoSum/guestsPromoN;
            };
            outStat.push({category:"Всего",n: totalN, sum: totalSum, av: totalAv});
            outStat.push({category:"----Сотрудники",n: employeesN, sum: employeesSum, av: employeesAv});
            outStat.push({category:"------в смене",n: employeesAtWorkN, sum: employeesAtWorkSum, av: employeesAtWorkAv});
            outStat.push({category:"------просто",n: employeesAsGuestsN, sum: employeesAsGuestsSum, av: employeesAsGuestsAv});
            outStat.push({category:"----Гости",n: guestsN, sum: guestsSum, av: guestsAv});
            outStat.push({category:"------бесплатные",n: guestsFreeN, sum: guestsFreeSum, av: guestsFreeAv});
            outStat.push({category:"------платные",n: guestsNotFreeN, sum: guestsNotFreeSum, av: guestsNotFreeAv});
            outStat.push({category:"--------стандарт (10 тг. минута)",n: guestsStandN, sum: guestsStandSum, av: guestsStandAv});
            outStat.push({category:"--------акции",n: guestsPromoN, sum: guestsPromoSum, av: guestsPromoAv});
            for (j = 0; j < promotions.length; j++) { //add all promotions
                if (promotions[j].N != 0){
                    promotions[j].av = promotions[j].Sum/promotions[j].N;
                };
                outStat.push({category:"----------"+promotions[j].name,n: promotions[j].N, sum: promotions[j].Sum, av: promotions[j].av});
            };
            return outStat;
        };

        this.computeStartDateThisDay = function(inputDate,role){//this function is used to compute proper start date for History page
            var startHH, startMM, startSS, usersSeeHistoryMin, newDate, output;
            if(role==$rootScope.adminRoleName){//admin user
                startHH = textConsts.getConstValueByName("startDayHH");
                startMM = textConsts.getConstValueByName("startDayMM");
                startSS = 0;
                if(inputDate.getHours()<startHH){
                    newDate = inputDate-textConsts.getOneDayInMSec();//substruct one day
                } else {
                    newDate = inputDate;
                }
            } else {//not Admin user
                usersSeeHistoryMin = textConsts.getConstValueByName("usersSeeHistoryMin");
                newDate = new Date (inputDate-usersSeeHistoryMin*60*1000) ;//not ADMIN users see only 0.5 hour
                startHH = newDate.getHours();
                startMM = newDate.getMinutes();
                startSS = newDate.getSeconds();
            };
            output = new Date(newDate);
            output.setHours(startHH,startMM,startSS,0);
            return output;
        };

        this.computeStartDateThisMonth = function(inputDate){//this function is used to compute proper start date for Stat page
            var startHH = textConsts.getConstValueByName("startDayHH");
            var startMM = textConsts.getConstValueByName("startDayMM");
            var startDay = textConsts.getConstValueByName("startDay");

            var newDate, output;
            if((inputDate.getDate()<startDay) || (inputDate.getDate()==startDay && inputDate.getHours()<startHH)){
                newDate = inputDate-10*textConsts.getOneDayInMSec();;//substract 10 days
            } else {
                newDate = inputDate;
            };
            output = new Date(newDate);
            output.setDate(startDay);
            output.setHours(startHH,startMM,0,0);
            return output;
        };

        this.computeDatesPastYear = function(inputDate){//this function is used to compute proper start and end date
            var output = {};
            var newDateB, newDateE;
            var periodDaysN = textConsts.getConstValueByName("pastYearBookingsPeriod");
            var oneDayInMSec = textConsts.getOneDayInMSec();
            newDateB = inputDate-365*oneDayInMSec;//substract 365 days
            newDateE = inputDate-365*oneDayInMSec+periodDaysN*oneDayInMSec;//substract 365 days plus 7 days
            output.startDate = new Date(newDateB);
            output.startDate.setHours(0,0,0,0);
            output.endDate = new Date(newDateE);
            output.endDate.setHours(0,0,0,0);
            return output;
        };

        this.isSelectedPromoBirthday = function(guestPromoId, allPromos){
            //if Birthday or any promo with 0 fix amount, then result = true
            var result = false;
            var guestPromoType, guestPromoValue;
            //var Npr = allPromos.length;
            var notFound = true;
            var j = 0;
            while(notFound){
                if(guestPromoId == allPromos[j].id){
                    guestPromoType = allPromos[j].type;
                    guestPromoValue = allPromos[j].value;
                    notFound = false;
                } else {
                    j++;
                    if(j>=allPromos.length){
                        notFound = false;
                    }
                };
            };
            if (guestPromoType == "fixAmount" && guestPromoValue == 0){//
              result = true;
            } else {result = false;};
            return result;
          };

        this.actualizateGuest = function(guestObj,promotions){
            //this function does some changes in guest before posting to DB
              var acutalizedGuestObj = guestObj;
              var isBirthdayPromo = this.isSelectedPromoBirthday(acutalizedGuestObj.promotion,promotions);
              if (acutalizedGuestObj.isEmployee) {
                acutalizedGuestObj.isFree = true;
              } else {
                acutalizedGuestObj.isDirector = false;
                acutalizedGuestObj.isEmployeeAtWork = false;
              };
              if (acutalizedGuestObj.isEmployee && acutalizedGuestObj.isDirector) {
                acutalizedGuestObj.isEmployeeAtWork = false;
              };
              if ((acutalizedGuestObj.isFree || acutalizedGuestObj.promotion == "Нет") && !isBirthdayPromo){//isBirthdayPromo=false
                acutalizedGuestObj.promotion = null;
              };
              acutalizedGuestObj.isActive = true;
              acutalizedGuestObj.isChecked = false;
              return acutalizedGuestObj;
            };

        this.isSelectedEmplDir = function(emplID, allEmployees){
                //selected employee is Director or Not?
                var result = false;
                var notFound = true;
                var j = 0;
                while(notFound){
                    if(emplID == allEmployees[j].id){
                        result = allEmployees[j].isDirector;
                        notFound = false;
                    } else {
                        j++;
                        if(j>=allEmployees.length){
                            notFound = false;
                        }
                    };
                };
                return result;
            };

        this.changeEmplIsDir = function(emplID,allEmployees){//returns isDirector when selecting employee from the list
                var result = false;
                var isDirector = this.isSelectedEmplDir(emplID,allEmployees);
                if (isDirector){
                  result = true;
                } else {
                  result = false;
                };
                return result;
            };

        this.changeEmplName = function(emplID,allEmployees){//what is employee's name?
                var result;
                var notFound = true;
                var j = 0;
                while(notFound){
                    if(emplID == allEmployees[j].id){
                        result = allEmployees[j].name;
                        notFound = false;
                    } else {
                        j++;
                        if(j>=allEmployees.length){
                            notFound = false;
                        }
                    };
                };
                return result;
            };

    }])

    .factory('staffFactory',['$resource','baseURL',function($resource,baseURL)//users
    {
            return $resource(baseURL+"staffs/:id", {}, {
                query: { method: "GET", isArray: true },
                create: { method: "POST"},
                get: { method: "GET"},
                remove: { method: "DELETE"},
                update: { method: "PUT"}
            });
    }])

    .factory('roleFactory',['$resource','baseURL',function($resource,baseURL)//roles
    {
            return $resource(baseURL+"roles/:id", {}, {
                query: { method: "GET", isArray: true },
                get: { method: "GET"}
            });
    }])

    .factory('roleMappingFactory',['$resource','baseURL',function($resource,baseURL)//role mappings
    {
            return $resource(baseURL+"RoleMappings/:id", {}, {
                query: { method: "GET", isArray: true },
                create: { method: "POST"},
                get: { method: "GET"},
                remove: { method: "DELETE"},
                update: { method: "PUT"}
            });
    }])

    .service('roleDetails',[function()//returns user's role (role name and id) based on user's id
    {
        this.getRoleDetailsByUserId = function(userId,roleMapping,roles)
        {
            var roleName="";
            var roleId="";
            var roleMappingId="";
            var roleDetails = {};
            var notFound = true;
            var j = 0;
            while(notFound){
                if(userId == roleMapping[j].principalId){
                    roleId = roleMapping[j].roleId;
                    roleMappingId = roleMapping[j].id;
                    notFound = false;
                } else {
                    j++;
                    if(j>=roleMapping.length){
                        notFound = false;
                    }
                };
            };
            notFound = true;
            j = 0;
            while(notFound){
                if(roleId == roles[j].id){
                    roleName=roles[j].name;
                    notFound = false;
                } else {
                    j++;
                    if(j>=roles.length){
                        notFound = false;
                    }
                };
            };
            roleDetails.roleName = roleName;
            roleDetails.roleId = roleId;
            roleDetails.roleMappingId = roleMappingId;
            return roleDetails;
        };
    }])

    .service('userDetails',[function()//returns user's name based on user's id
    {
        this.getUserNameByUserId = function(userId,staffs)
        {
            var email="";
            var created="";
            var notFound = true;
            var j = 0;
            while(notFound){
                if(userId == staffs[j].id){
                    email = staffs[j].email;
                    notFound = false;
                } else {
                    j++;
                    if(j>=staffs.length){
                        notFound = false;
                    }
                };
            };
            return email;
        };
    }])

    .service('promoDetails',[function()//returns promotion's name based on its id
        {
            this.getNameById = function(promoId,promotions){
                var promoName;
                if(promoId != undefined){
                    var notFound = true;
                    var j = 0;
                    while(notFound){
                        if(promoId == promotions[j].id){
                            promoName = promotions[j].name;
                            notFound = false;
                        } else {
                            j++;
                            if(j>=promotions.length){
                                notFound = false;
                            }
                        };
                    };
                } else {promoName=undefined};
                return promoName;
            };
        }])

    .service('rowColorsGuests',[function()//sets row color
        {
            this.setRowColor = function(isFree,promotion,isEmployee){//sets row color for guests
                var rowClass = "default";
                if (isEmployee) {
                    rowClass = "success";
                } else {
                    if(isFree) {
                    rowClass = "danger";
                    } else {
                        if (promotion != undefined && promotion != null && promotion != "Нет"){
                            rowClass = "info";
                        } else {rowClass = "active"};
                    };
                };
                return rowClass;
            };

            this.setRowColorEmpl = function(isEmployeeAtWork){//sets row color for employees
                var rowClass = "default";
                if (isEmployeeAtWork) {
                    rowClass = "success";
                } else {
                    rowClass = "danger";
                    } ;
                return rowClass;
            };
    }])

    .service('rowColorsBookings',[function()//set row color depending on guest
        {
            this.setRowColor = function(bookingStatus,statuses){
                var rowClass = "active";
                if (bookingStatus==statuses[1]){//пришли
                    rowClass = "success";
                } else {
                    if (bookingStatus==statuses[2]){//не пришли
                        rowClass = "info";
                    } else {
                        if (bookingStatus==statuses[3]){//отмена
                            rowClass = "danger";
                    }
                }};
                return rowClass;
            };
    }])

    .service('convertMMtoDDHHMM',[function()
        {
            this.convertMinutes = function(minutes){
                //convert timeinclub (minutes) into days, hours, minutes
                var dd, hh, mm, result, ddS, hhS, mmS;
                var oneDay = 60*24;
                if (minutes < 60){
                  result = minutes.toString() + ' м.';
                } else if (minutes < oneDay) {
                  hh = Math.floor( minutes / 60);
                  hhS = hh.toString();
                  mm = minutes % 60;
                  mmS = mm.toString();
                  result = hhS + ' ч. ' + mmS + ' м.';
                  } else if (minutes >= oneDay) {
                    dd = Math.floor( minutes / oneDay);
                    ddS = dd.toString();
                    hh = Math.floor( (minutes-dd*oneDay) / 60);
                    hhS = hh.toString();
                    mm = (minutes-dd*oneDay) % 60;
                    mmS = mm.toString();
                    result = ddS + ' д. ' + hhS + ' ч. ' + mmS + ' м.';
                  };
                return result;
            };
    }])

    .service('checkoutService',[function()//this service helps using the data on guests to checkout from MainCtrl
        {
            var arrStored = [];
            var dateTimeStored;
            this.saveArr = function(inputArr,inputDateTime){
                arrStored = inputArr;
                dateTimeStored = inputDateTime;
            };
            this.fetchArr = function(){
                return arrStored;
            };
            this.fetchDateTime = function(){
                return dateTimeStored;
            };
        }])

    .service('msgService',[function()//this service contains console.log messages and window.alert notifications used in controllers
            {
                var messages = [
                    {name:"selectGuestToClose",     text:"Нужно выбрать одного или нескольких гостей, которых вы хотите закрыть."},
                    {name:"loadingInProgress",      text:"Загрузка данных..."},
                    {name:"cannotQueryData",        text:"Не могу получить данные с сервера. "},
                    {name:"doNotRemoveFrstRow",     text:"Не нужно удалять первую строку. Просто нажмите Отменить, если не хотите добавлять группу."},
                    {name:"needNamesForAllGuests",  text:"Укажите имена для всех гостей."},
                    {name:"selectJustOneRow",       text:"Для изменения можно выбрать только одну запись."},
                    {name:"selectTheRowToChange",   text:"Выберите одну запись для изменения."},
                    {name:"selectTheRowToDelete",   text:"Выберите запись для удаления."},
                    {name:"cannotUpdageRecord",     text:"Не могу обновить запись. Возможно проблемы на сервере или у вас нет соответствующего доступа. Попробуйте позже."},
                    {name:"cannotSaveRecord",       text:"Не могу добавить запись. Возможно проблемы на сервере или у вас нет соответствующего доступа. Попробуйте позже."},
                    {name:"cannotDeleteRecord",     text:"Не могу удалить запись. Возможно проблемы на сервере или у вас нет соответствующего доступа. Попробуйте позже."},
                    {name:"recordCreated",          text:"Запись успешно создана"},
                    {name:"needDateTimeBooking",    text:"Укажите дату и время брони"},
                    {name:"noBookingInPast",        text:"Дата и время брони должны быть больше текущих"},
                    {name:"bookingPhoneNotUnique",  text:"Создание брони: клиент с таким номером уже есть в списке, не сохраняем"},
                    {name:"bookingWrongStatus",     text:"У брони нельзя или нет смысла менять статус: "},
                    {name:"validateDatesBegEnd",    text:"Дата окончания выборки должна быть больше даты начала"},
                    {name:"adminRoleNeeded",        text:"Данная операция доступна только для пользователей с расширенными правами. Если Вы уверены, что у вас есть такие права, попробуйте выйти и войти заново."},
                    {name:"cannotChangeOldHisotory",text:"Изменить можно данные только по тем гостям, которые убыли в течение 24 часов; старые данные не подлежат изменению."},
                    {name:"phoneNotUnique",         text:"Номер телефона является уникальным, не должен повторяться. Клиент с таким номером телефона уже существует."},
                    {name:"phoneWrongFormat",       text:"Не могу добавить клиента. Некорректный формат телефона."},
                    {name:"selectFile",             text:"Сначала нужно выбрать файл"},
                    {name:"clientsUploadCompleted", text:"Процедура загрузки клиентов из файла завершена. Были созданы все клиенты, кроме клиентов с повторящимимся и некорректными номерами."},
                    {name:"passwordIsNotConfirmed", text:"Пароль и повторение пароля не совпадают."},
                    {name:"cannotDeleteAdminUser",  text:"Не могу удалить пользователя с расширенными правами"},
                    {name:"cannotLogin",            text:"Не могу войти. Проверьте логин и пароль."},
                    {name:"cannotUpdateThisBooking",text:"Изменять можно только брони со статусом Новая"},
                    {name:"confirmBackToMain",      text:"Гость будет возвращён в Зал. Подтвердите."}
                ];

                this.getMsg = function(inputName){//function returns message text
                    var txt="";
                    var notFound = true;
                    var j = 0;
                    while(notFound){
                        if(messages[j].name == inputName){
                            txt = messages[j].text;
                            notFound = false;
                        } else {
                            j++;
                            if(j>=messages.length){
                                notFound = false;
                            }
                        };
                    };
                    return txt;
                };
        }])

    .service('guestFilterFactory',[function()
        {
            this.searchGuestNameAndCompany = function(item,searchStrInp){
                var res;
                var searchStr = searchStrInp.toUpperCase();
                if(searchStr == '' || searchStr == null || searchStr == undefined){
                  res = true;
                } else {
                  var res1, res2;
                  var nInp = item.name;//guest name
                  if(nInp == '' || nInp == null || nInp == undefined){
                    res1 = false;
                  } else {
                    var n = nInp.toUpperCase();
                    res1 = n.includes(searchStr);//not a strict search for name
                  };
                  var cNDInp = item.companyN;//company number
                  if(cNDInp == '' || cNDInp == null || cNDInp == undefined){
                    res2 = false;
                  } else {
                    var cND = cNDInp.toString();
                    var cN = cND.toUpperCase();
                    //res2 = cN.includes(searchStr);
                    if (cN == searchStr) {//strict search for company number
                        res2 = true;
                    } else res2 = false;
                  };
                  res = res1 || res2;
                };
                return res;
            };

            this.computeSearchTotals = function(searchInput,guests){//compute filter searched totals (sum, number of guests)
                var searchTotals=[];
                searchTotals[0]=0;//number of guests
                searchTotals[1]=0;//amount paid
                var N = guests.length;
                for (var j = 0; j < N; j++){
                  if (this.searchGuestNameAndCompany(guests[j],searchInput))
                  {
                    searchTotals[0]++;
                    searchTotals[1] = searchTotals[1]+guests[j].amount;
                  };
                };
                return searchTotals;
              };
        }])

    .service('textConsts',[function()//this service contains all constants
                {
                    const calendarSettings = [
                        {name: "hourStep", value: 1},//spinner - hours
                        {name: "minuteStep", value: 10},//spinner - minutes
                        {name: "format", value: "dd.MM.yyyy"},//date format
                        {name: "showWeeks", value: false},//don't show weeks
                        {name: "startingDay", value: 1}//start with monday
                    ];
                    const phoneMask = "+7(999)999 99 99";//mobile phone mask
                    const bookingStatuses = ["Новая","Пришли","Не пришли","Отмена"];//possible statuses for a booking
                    const defaultRoleForNewUsers = "user";//what role is assigned to new users by default
                    const promotionTypes = [
                        {type:"fixAmount", desc: "Фиксированная стоимость"},//типы акций - для создания новых акций
                        {type:"fixDiscount", desc: "Скидка"}
                    ];
                    const adminRoleName = "admin"; //Name of admin role
                    const oneDayInMSec = 24*3600*1000;//one day in milliseconds

                    /////////////////////////////////all constants used
                    const constArr = [
                        {name:"pricePerMinute",         value:10,   desc:"Цена за минуту, тг"},
                        {name:"maxAmount",              value:3000, desc:"Максимальный чек, тг"},
                        {name:"startDay",               value:6,    desc:"Первый день отчетного месяца"},
                        {name:"startDayHH",             value:10,   desc:"Старт первого дня ЧАСЫ"},
                        {name:"startDayMM",             value:0,    desc:"Старт первого дня МИНУТЫ"},
                        {name:"usersSeeHistoryMin",     value:30,   desc:"Сколько минут истории видят пользователи"},
                        {name:"adminWagePerHour",       value:300,  desc:"З/п админа за час, тг"},
                        {name:"pastYearBookingsPeriod", value:7,    desc:"За сколько дней показывать прошлогодние брони"},
                        {name:"companiesMaxNum",        value:50,   desc:"Макс. кол-во компаний (зал, добавление гостя)"}
                    ];

                    this.getCalendarSetting = function(inputName){
                        var value;
                        for(var j = 0; j < calendarSettings.length; j++){
                            if(calendarSettings[j].name == inputName) value = calendarSettings[j].value;
                        };
                        return value;
                    };

                    this.getPhoneMask = function(){
                        return phoneMask;
                    };

                    this.getBookingStatuses = function(){
                        return bookingStatuses;
                    };

                    this.getDefaultRoleForNewUsers = function(){
                        return defaultRoleForNewUsers;
                    };

                    this.getPromotionTypes = function(){
                        return promotionTypes;
                    };

                    this.getAdminRoleName = function(){
                        return adminRoleName;
                    };

                    this.getOneDayInMSec = function(){
                        return oneDayInMSec;
                    };
                    /////////////////////////////////////////

                    this.getConstArr = function(){
                        return constArr;
                    };

                    this.getConstValueByName = function(inputConstName)
                    {
                        var notFound = true;
                        var i=0;
                        var constValue;
                        while(notFound){
                            if(inputConstName==constArr[i].name){
                                constValue = constArr[i].value;
                                notFound = false;
                            } else {
                                i++;
                                if(i>=constArr.length){
                                    notFound = false;
                                }
                            };
                        }
                        return constValue;
                    };

        }])

    ;
