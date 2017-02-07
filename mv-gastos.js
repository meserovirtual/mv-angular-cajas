(function () {

    'use strict';


    angular.module('mvGastos', [])

        .component('gastos', gastos())
        .service('GastosService', GastosService);

    function gastos() {
        return {
            bindings: {},
            templateUrl: window.installPath + '/mv-angular-cajas/mv-gastos.html',
            controller: GastosController
        }
    }

    GastosController.$inject = ["$routeParams", "MovimientosService", "MvUtilsGlobals", "MvUtils", "UserService"];
    function GastosController($routeParams, MovimientosService, MvUtilsGlobals, MvUtils, UserService) {
        var vm = this;
        vm.movimiento = '012';
        vm.comentario = '';
        vm.subtipo = '00';
        vm.forma_pago = '01';
        vm.save = save;
        vm.id = $routeParams.id;

        function save() {
            //tipo_asiento, subtipo_asiento, sucursal_id, forma_pago, transferencia_desde, total, descuento, detalle, items, cliente_id, usuario_id, comentario, callback
            MovimientosService.armarMovimiento(vm.movimiento, vm.subtipo, UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, vm.forma_pago, '', vm.importe, '', vm.comentario, [], 0, 1, vm.comentario, function (data) {
                if (!isNaN(data)) {
                    MvUtils.showMessage('success', 'Gasto generado con éxito');
                    vm.movimiento = '012';
                    vm.comentario = '';
                    vm.subtipo = '00';
                    vm.forma_pago = '01';
                } else {
                    MvUtils.showMessage('error', 'Error al guardar el gasto');
                }

            });
        }


    }


    GastosService.$inject = ['$http'];
    function GastosService($http) {
        var service = {};
        var url = './stock-api/gastos.php';
        service.getGastos = getGastos;
        service.getGastoByID = getGastoByID;
        service.getGastoByName = getGastoByName;
        service.saveGasto = saveGasto;
        service.deleteGasto = deleteGasto;


        return service;

        function getGastos(callback) {
            return $http.post(url,
                {function: 'getGastos'},
                {cache: true})
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {

                });
        }

        function getGastoByID(id, callback) {
            getGastos(function (data) {
                //console.log(data);
                var response = data.filter(function (entry) {
                    return entry.gasto_id === parseInt(id);
                })[0];
                callback(response);
            })

        }

        function getGastoByName(name, callback) {
            getGastos(function (data) {
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


        function saveGasto(gasto, _function, callback) {

            return $http.post(url,
                {function: _function, gasto: JSON.stringify(gasto)})
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                });
        }


        function deleteGasto(id, callback) {
            return $http.post(url,
                {function: 'deleteGasto', id: id})
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                });
        }

    }

})();

