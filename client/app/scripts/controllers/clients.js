'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:ClientsCtrl
 * @description
 * # ClientsCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('ClientsCtrl', ['$scope','clientListFactory','$state','$rootScope','msgService','textConsts',
  function ($scope,clientListFactory,$state,$rootScope,msgService,textConsts) {
    $scope.showInfo = false;//show / hide table with clients
    $scope.message = msgService.getMsg("loadingInProgress");
    $scope.phoneMask = textConsts.getPhoneMask(); //9 stands for any digit   
    var N;
    
    clientListFactory.query(  //fetch clients from the REST server
        function(response) {
          $scope.clientlist = response;
          N = $scope.clientlist.length;
          $scope.showInfo = true;
        },
        function(response) {
          $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
    });

    $scope.newClient = new clientListFactory(); //new empty client object  
        
    $scope.addClient = function(newClient,isManually){//add one new client - post to DB via REST server
        //check - client's phone number should be unique
        var isMaskOK = false;        
        if(newClient.phone.match(/^\d+$/) && newClient.phone.length==10) isMaskOK = true;
        //isMaskOK == true if phone length=10 and phone filed contains digitals only
        if(isMaskOK){//OK - mask is passed
            var isUnique = true;
            var Today = new Date();
            for (var i = 0; i < N; i++){
                if(newClient.phone == $scope.clientlist[i].phone) {
                    isUnique = isUnique && false;
                };
            };
            if(isUnique){ //new client with unique phone number
                if(isManually){
                    newClient.sysComment = "добавлено "+Today+" пользователем "+$rootScope.currentUserName;
                } else newClient.sysComment = "загружено из файла "+Today+" пользователем "+$rootScope.currentUserName;                
                clientListFactory.create(newClient, function() {   //save new client                    
                    if(isManually){
                        $scope.newClient = {};
                        $state.reload(); //update the list of clients
                    };
                },
                function()
                    {
                        if(isManually){window.alert(msgService.getMsg("cannotSaveRecord"));}
                        else console.log("clientListFactory: "+msgService.getMsg("cannotSaveRecord"));
                    }
                );
            } else { //phone number is not unique
                if(isManually){window.alert(msgService.getMsg("phoneNotUnique"));}
                else console.log("загрузка из excel файла: "+msgService.getMsg("phoneNotUnique"));
            };
        } else {
            if(isManually){window.alert(msgService.getMsg("phoneWrongFormat"));}
            else console.log("загрузка из excel файла: "+msgService.getMsg("phoneWrongFormat"));
        };        
    };

    $scope.cancelAddingClient = function(){ //cancel Adding guest - clear fields and hide the modal
        $scope.newClient = {};
    };

    $scope.DeleteClient = function(newClient){//delete selected client
        if($rootScope.isAdmin){
            var clientSelected = false;//is there any user selected?   
            var clientToDeleteId;
            for (var i = 0; i < N; i++){
                clientSelected = clientSelected || $scope.clientlist[i].isSelected;//is there any promo selected?
            };//end for
            if (clientSelected) {
              if (window.confirm("Подтвердите удаление") == true) {
                for (i = 0; i < N; i++){
                  if ($scope.clientlist[i].isSelected){
                    clientToDeleteId = $scope.clientlist[i].id;                  
                    //remove client                  
                    clientListFactory.remove({id: clientToDeleteId}, function() {
                        //Removed sucessfully
                        $state.reload();
                        },
                        function(){
                        window.alert(msgService.getMsg("cannotDeleteRecord"));
                    });                    
                  };//end if
                };//end for
              } else {//removing is not confirmed
                for (i = 0; i < N; i++){ 
                  $scope.clientlist[i].isSelected = false;}
                }            
            } else {window.alert(msgService.getMsg("selectTheRowToDelete"));};
        } else {window.alert(msgService.getMsg("adminRoleNeeded"));};
    };

    $scope.downloadExampleXLS = function(){//download example excel file
        function datenum(v, date1904) {
            if(date1904) v+=1462;
            var epoch = Date.parse(v);
            return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
        }
         
        function sheet_from_array_of_arrays(data, opts) {
            var ws = {};
            var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
            for(var R = 0; R != data.length; ++R) {
                for(var C = 0; C != data[R].length; ++C) {
                    if(range.s.r > R) range.s.r = R;
                    if(range.s.c > C) range.s.c = C;
                    if(range.e.r < R) range.e.r = R;
                    if(range.e.c < C) range.e.c = C;
                    var cell = {v: data[R][C] };
                    if(cell.v == null) continue;
                    var cell_ref = XLSX.utils.encode_cell({c:C,r:R});
                    
                    if(typeof cell.v === 'number') cell.t = 'n';
                    else if(typeof cell.v === 'boolean') cell.t = 'b';
                    else if(cell.v instanceof Date) {
                        cell.t = 'n'; cell.z = XLSX.SSF._table[14];
                        cell.v = datenum(cell.v);
                    }
                    else cell.t = 's';
                    
                    ws[cell_ref] = cell;
                }
            }
            if(range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
            return ws;
        }
         
        /* original data */
        var data = [["phone","name"],[7051881515, "Владимир"],[7774486678,"Иван"], [7051114203]];
        var ws_name = "SheetJS";
         
        function Workbook() {
            if(!(this instanceof Workbook)) return new Workbook();
            this.SheetNames = [];
            this.Sheets = {};
        }
         
        var wb = new Workbook(), ws = sheet_from_array_of_arrays(data);
         
        /* add worksheet to workbook */
        wb.SheetNames.push(ws_name);
        wb.Sheets[ws_name] = ws;
        var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
        
        function s2ab(s) {
            var buf = new ArrayBuffer(s.length);
            var view = new Uint8Array(buf);
            for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }
        saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), "template.xlsx");
    };

    $scope.clientsFromXLSX = [];
    var X = XLSX;
    var XW = {
        /* worker message */
        msg: 'xlsx',
        /* worker scripts */                      
        worker: './bower_components/js-xlsx/xlsxworker.js'//bower_components/js-xlsx/xlsxworker.js
    };
    var global_wb;
    var OUT = document.getElementById('out');
    var process_wb = (function() {        
        var to_json = function to_json(workbook) {
            var result = {};
            workbook.SheetNames.forEach(function(sheetName) {
                var roa = X.utils.sheet_to_json(workbook.Sheets[sheetName]);
                if(roa.length) result = roa;                     
            });
            return result;
        };
    
        return function process_wb(wb) {
            global_wb = wb;
            var output = "";
            var infoBox = "";//show info to user
            output = to_json(wb);
            $scope.clientsFromXLSX = output;//$scope.clientsFromXLSX is the array to be saved into DB
            infoBox = "Выбранный файл содержит "+output.length+" строк (клиентов). Нажмите кнопку Загрузить список из файла для заливки данных о клиентах на сервер.";
            if(OUT.innerText === undefined) OUT.textContent = infoBox;
            else OUT.innerText = infoBox;
            if(typeof console !== 'undefined') console.log("output", new Date());
        };
    })();
    
    var do_file = (function() {
        var rABS = typeof FileReader !== "undefined" && (FileReader.prototype||{}).readAsBinaryString;
        var use_worker = typeof Worker !== 'undefined';
    
        var xw = function xw(data, cb) {
            var worker = new Worker(XW.worker);
            worker.onmessage = function(e) {
                switch(e.data.t) {
                    case 'ready': break;
                    case 'e': console.error(e.data.d); break;
                    case XW.msg: cb(JSON.parse(e.data.d)); break;
                }
            };
            worker.postMessage({d:data,b:rABS?'binary':'array'});
        };
    
        return function do_file(files) {
            var rABS = true;//added by ME
            var use_worker = true;//added by ME
            var f = files[0];            
            var reader = new FileReader();
            reader.onload = function(e) {
                if(typeof console !== 'undefined') console.log("onload", new Date(), rABS, use_worker);
                var data = e.target.result;
                if(!rABS) data = new Uint8Array(data);
                if(use_worker) xw(data, process_wb);
                else process_wb(X.read(data, {type: rABS ? 'binary' : 'array'}));
            };
            if(rABS) reader.readAsBinaryString(f);
            else reader.readAsArrayBuffer(f);
        };
    })();       
    
    (function() {
        var xlf = document.getElementById('xlf');
        if(!xlf.addEventListener) return;
        function handleFile(e) { do_file(e.target.files); }
        xlf.addEventListener('change', handleFile, false);//if new excel file is selected        
    })();

    $scope.uploadFromXLS = function(){//upload excel file to server and create clients from excel
        if($scope.clientsFromXLSX.length) {
            console.log("start saving clients from XLSX to DB: total "+$scope.clientsFromXLSX.length+" clients");
            for(var j = 0; j < $scope.clientsFromXLSX.length; j++){
                $scope.addClient($scope.clientsFromXLSX[j],false);
            };
            $state.reload();//reload after all clients created
            window.alert(msgService.getMsg("clientsUploadCompleted"));
        } else {window.alert(msgService.getMsg("selectFile"));};
    };

    //calendar settings from textConsts service
    $scope.hourStep = textConsts.getCalendarSetting("hourStep");
    $scope.minuteStep = textConsts.getCalendarSetting("minuteStep");
    $scope.format = textConsts.getCalendarSetting("format");
    $scope.dateOptions = {
      showWeeks: textConsts.getCalendarSetting("showWeeks"),
      startingDay: textConsts.getCalendarSetting("startingDay")
    };

}]);