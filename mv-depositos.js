(function () {

    'use strict';


    angular.module('mvDepositos', [])

        .component('depositos', depositos())
        .service('DepositosService', DepositosService);

    function depositos() {
        return {
            bindings: {},
            templateUrl: window.installPath + '/mv-angular-cajas/mv-depositos.html',
            controller: DepositosController
        }
    }

    DepositosController.$inject = ["$routeParams", "MovimientosService", "UserService", "MvUtils", "MvUtilsGlobals"];
    function DepositosController($routeParams, MovimientosService, UserService, MvUtils, MvUtilsGlobals) {
        var vm = this;
        vm.movimiento = '000';
        vm.comentario = 'Movimiento entre cuentas';
        vm.subtipo = '00';
        vm.forma_pago = '01';
        vm.save = save;
        vm.id = $routeParams.id;
        vm.destino = '11';
        vm.origen = '01';


        function save() {
            MvUtilsGlobals.startWaiting();
            if (vm.importe < 1 || vm.importe == '' || vm.importe == undefined) {
                MvUtils.showMessage('error', 'Debe ingresar un importe');
                return;
            }
            //tipo_asiento, subtipo_asiento, sucursal_id, forma_pago, transferencia_desde, total, descuento, detalle, items, cliente_id, usuario_id, comentario, callback
            MovimientosService.armarMovimiento(vm.movimiento, vm.subtipo, UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, vm.destino, vm.origen, vm.importe, '', vm.comentario, [], 0, 1, vm.comentario, function (data) {
                MvUtilsGlobals.stopWaiting();
                if (data > -1) {
                    MvUtils.showMessage('success', "Depósito realizado con éxito");
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

