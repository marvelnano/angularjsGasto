var app = angular.module("app", ["ngRoute"]);

//tag: helper
var myHelpers = {
    dateObjToString: function(dateObj){
        var year, month, day;

        year = String(dateObj.getfullyear());
        month = String(dateObj.getMonth() + 1);
        if(month.length == 1){
            month = "0" + month;
        }        
        day = String(dateObj.getDate());
        if(day.length == 1){
            day = "0" + day;
        }
        return year + "-"  + month + "-" + day;
    },
    stringToDateObj: function(string){
        return new Date(string.substring(0,4), string.substring(5,7) + 1, string.substring(8,12),)
    }
};

//tag: rutas
app.config(function($routeProvider){
    $routeProvider
    .when("/", {
        templateUrl: "views/gastos.html",
        controller: "GastosViewController"
    })
    .when("/gastos", {
        templateUrl: "views/gastos.html",
        controller: "GastosViewController"
    })
    .when("/gastos/nuevo", {
        templateUrl: "views/gastoForm.html",
        controller: "GastoViewController"
    })
    .when("/gastos/edit/:id", {
        templateUrl: "views/gastoForm.html",
        controller: "GastoViewController"
    })
    .otherwise({
        redirectTo: "/"
    });
});

app.factory('Gastos', function($http){
    var service = {};

    service.entries = [];

    //tag: 1era forma de mostrar datos de una api... 
    //note: angular version 1.2.x puede usar .success; angular version 1.6.x recibiras error " .success is not a function"
    /*$http.get('data/get_all.json').
    success(function(data){
        service.entries = data;

        //convertir fecha strings a fecha objects
        service.entries.forEach(function(element){
            element.date = myHelpers.stringToDateObj(element.date);
        });        
    }).
    error(function(data, status){
        //alert("error!");
        alert("Ha fallado la petición. Estado HTTP:"+status);
    });*/

    //tag: 2da forma de mostrar datos de una api
    $http({
        method: 'GET', 
        url: 'data/get_all.json'
    }).then(function(response) {
        //console.log('data: '+response.status);
        service.entries = response.data;

        //tag: convertir fecha strings a fecha objects
        service.entries.forEach(function(element){
            element.date = myHelpers.stringToDateObj(element.date);
        });  
    }, 
    function(response) {
        alert("Ha fallado la petición. Estado HTTP:"+response.status);
    });

    //note: genera un nuevo id: solo para modo offline
    /*service.getNewId = function(){
        if(service.newId){
            service.newId++;
            return service.newId;
        }else{
            var entryMax = _.max(service.entries, function(entry){
                return entry.id;
            });
            service.newId = entryMax.id+1;
            return service.newId;
        }
    }*/

    service.getById = function(id){
        return _.find(service.entries, function(entry){return entry.id == id});
    }

    //tag: crea o actualiza un nuevo gasto
    service.save = function(entry){
        var toUpdate = service.getById(entry.id);

        //si existe gasto actualizamos
        if(toUpdate){
            //note: actualiza gasto solo para modo offlinesolo para modo offline
            //_.extend(toUpdate, entry);
            $http.post('data/update.json', entry).
            then(function(response){
                if(response.data.success){
                    _.extend(toUpdate, entry);
                }
            },
            function(response){
                alert("Ha fallado la petición. Estado HTTP:"+response.status);
            });
        }else{
            //note: genera un nuevo id: solo para modo offlinesolo para modo offline
            /*entry.id = service.getNewId();
            service.entries.push(entry);*/
            $http.post('data/create.json', entry).
            then(function(response){
                entry.id = response.data.newId;
                service.entries.push(entry);
            },
            function(response){
                alert("Ha fallado la petición. Estado HTTP:"+response.status);
            });
        }
    }

    //tag: elimina gasto
    service.remove = function(entry){
        //note: elimina gasto solo para modo offlinesolo para modo offline
        //service.entries = _.reject(service.entries, function(element){ return entry.id == element.id});
        $http.post('data/delete.json', entry).
            then(function(response){
                if(response.data.success){
                    service.entries = _.reject(service.entries, function(element){ return entry.id == element.id});
                }
            },
            function(response){
                alert("Ha fallado la petición. Estado HTTP:"+response.status);
            });
    }

    return service;
});

//tag: Controlador vista de gastos
app.controller("GastosViewController", ['$scope', '$location', 'Gastos', function($scope, $location, Gastos){
    $scope.title = 'Simple Seguimiento de Gastos';
    $scope.gastos = Gastos.entries;

    //tag: regresa al inicio al hacer click en titulo al lado del icono
    $scope.inicio = function(){
        $location.path('/');
    }

    //tag: calcula el total de gastos de la lista
    $scope.getTotalGasto = function(){
        var total = 0;
        $scope.gastos.forEach(x => {
            total += x.amount;
        })

        return total;
    }

    //tag: botón eliminar
    $scope.remove = function(gasto){
        Gastos.remove(gasto);
    }

    //tag: actualiza constantemente la vista
    $scope.$watch(function(){
        return Gastos.entries;
    },
    function(entries){
        $scope.gastos = entries;
    });
}]);

//tag: Controlador vista de Formulario de Gasto
app.controller("GastoViewController", ['$scope', '$routeParams', '$location', 'Gastos', 
    function($scope, $routeParams, $location, Gastos){
    //tag: se valida si se va a crear o actualizar el gasto
    if(!$routeParams.id){
        $scope.gasto = {date: new Date()};
    }else{   
        $scope.gasto = _.clone(Gastos.getById($routeParams.id));
        $scope.gasto.date = new Date(); 
    }    
    
    //tag: botón guardar
    $scope.save = function(){
        Gastos.save($scope.gasto);
        $location.path('/');
    }
}]);

/*app.directive('jvrGasto', function(){
    return {
        restrict: 'E',
        templateUrl: 'views/gasto.html'
        //template: '<td></td><td>{{gasto.description | uppercase}}</td><td></td><td></td><td></td>'
    }
});*/