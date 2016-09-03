(function () {

    'use strict';


    angular.module('nombreapp.stock.depositos', ['ngRoute', 'toastr', 'acMovimientos'])

        .config(['$routeProvider', function ($routeProvider) {
            $routeProvider.when('/depositos/:id', {
                templateUrl: './depositos/depositos.html',
                controller: 'DepositosController',
                data: {requiresLogin: true}
            });
        }])

        .controller('DepositosController', DepositosController)
        .service('DepositosService', DepositosService);

    DepositosController.$inject = ["$scope", "$routeParams", "DepositosService", "$location", "toastr", "MovimientosService", "AcUtilsGlobals"];
    function DepositosController($scope, $routeParams, DepositosService, $location, toastr, MovimientosService, AcUtilsGlobals) {
        var vm = this;
        vm.movimiento = '000';
        vm.comentario = 'Movimiento entre cuentas';
        vm.subtipo = '00';
        vm.forma_pago = '01';
        vm.save = save;
        vm.id = $routeParams.id;
        vm.destino = '04';
        vm.origen = '01';


        function save() {
            if (vm.importe < 1 || vm.importe == '' || vm.importe == undefined) {
                toastr.error('Debe ingresar un importe');
                return;
            }
            //tipo_asiento, subtipo_asiento, sucursal_id, forma_pago, transferencia_desde, total, descuento, detalle, items, cliente_id, usuario_id, comentario, callback
            MovimientosService.armarMovimiento(vm.movimiento, vm.subtipo, AcUtilsGlobals.sucursal_id, AcUtilsGlobals.pos_id, vm.destino, vm.origen, vm.importe, '', vm.comentario, [], 0, 1, vm.comentario, function (data) {
                if (data > -1) {
                    toastr.success("Depósito realizado con éxito");
                    vm.movimiento = '000';
                    vm.subtipo = '00';
                    vm.forma_pago = '01';
                    vm.destino = '04';
                    vm.origen = '01';
                    vm.importe = '';

                }
            });
        }


    }


    DepositosService.$inject = ['$http'];
    function DepositosService($http) {
        var service = {};
        var url = './stock-api/depositos.php';
        service.getDepositos = getDepositos;
        service.getDepositoByID = getDepositoByID;
        service.getDepositoByName = getDepositoByName;
        service.saveDeposito = saveDeposito;
        service.deleteDeposito = deleteDeposito;


        return service;

        function getDepositos(callback) {
            return $http.post(url,
                {function: 'getDepositos'},
                {cache: true})
                .success(function (data) {
                    callback(data);
                })
                .error();
        }

        function getDepositoByID(id, callback) {
            getDepositos(function (data) {
                //console.log(data);
                var response = data.filter(function (entry) {
                    return entry.deposito_id === parseInt(id);
                })[0];
                callback(response);
            })

        }

        function getDepositoByName(name, callback) {
            getDepositos(function (data) {
                //console.log(data);
                var response = data.filter(function (elem) {
                    var elemUpper = elem.nombre.toUpperCase();

                    var n = elemUpper.indexOf(name.toUpperCase());

                    if (n === undefined || n === -1) {
                        n = elem.nombre.indexOf(name);
                    }

                    if (n !== undefined && n > -1) {
                        return elem;
                    }
                });
                callback(response);
            })

        }


        function saveDeposito(deposito, _function, callback) {

            return $http.post(url,
                {function: _function, deposito: JSON.stringify(deposito)})
                .success(function (data) {
                    callback(data);
                })
                .error();
        }


        function deleteDeposito(id, callback) {
            return $http.post(url,
                {function: 'deleteDeposito', id: id})
                .success(function (data) {
                    callback(data);
                })
                .error();
        }

    }

})();

