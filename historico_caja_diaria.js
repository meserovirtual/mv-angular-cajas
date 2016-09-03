(function () {
    'use strict';

    angular.module('nombreapp.stock.historicoCajaDiaria', ['ngRoute', 'nombreapp.stock.cajas', 'acMovimientos'])

        .config(['$routeProvider', function ($routeProvider) {
            $routeProvider.when('/historico_caja_diaria', {
                templateUrl: './historico_caja_diaria/historico_caja_diaria.html',
                controller: 'HistoricoCajaDiariaController',
                data: {requiresLogin: true}
            });
        }])

        .controller('HistoricoCajaDiariaController', HistoricoCajaDiariaController);


    HistoricoCajaDiariaController.$inject = ['CajasService', '$location', 'MovimientosService', 'SucursalesService'];
    function HistoricoCajaDiariaController(CajasService, $location, MovimientosService, SucursalesService) {

        var vm = this;
        vm.asientos = [];
        vm.filtroSucursal = filtroSucursal;
        vm.getDetalles = getDetalles;
        vm.clearDetalles = clearDetalles;
        vm.saldoInicial = 0.0;
        vm.sucursal = {};
        vm.sucursales = [];
        vm.cajas = {};
        vm.caja = [];


        function filtroSucursal() {
            CajasService.getCajasBySucursal(vm.sucursal.sucursal_id, function (data) {
                vm.cajas = data;
                //vm.caja = data[0];
            })
        }

        SucursalesService.get(function (data) {
            vm.sucursales = data;
            vm.sucursal = data[0];
            CajasService.getCajasBySucursal(vm.sucursal.sucursal_id, function (data) {

                vm.cajas = data;
                //vm.caja = data[0];
            })
        });


        function clearDetalles() {
            vm.asientos = [];
            vm.saldoInicial = 0.0;

        }

        function getDetalles() {
            clearDetalles();
            vm.saldoInicial = parseFloat(vm.caja.saldo_inicial);

            //console.log(vm.caja);

            CajasService.getCajaDiariaFromTo(vm.sucursal.sucursal_id, vm.caja.asiento_inicio_id, vm.caja.asiento_cierre_id, function (data) {
                //console.log(data);
                var asiento = [];
                for (var i = 0; i < data.length; i++) {
                    if (data[i].cuenta_id.indexOf('1.1.1.0') > -1) {
                        vm.saldoInicial += parseFloat(data[i].importe);
                    }


                    if (i > 0 && data[i - 1].asiento_id == data[i].asiento_id) {
                        asiento.push(data[i]);
                    } else {
                        if (asiento.length > 0) {
                            vm.asientos.push(asiento);
                        }
                        asiento = [];
                        asiento.push(data[i]);

                    }
                }

                if (asiento.length > 0) {
                    vm.asientos.push(asiento);
                }

                //console.log(vm.asientos);
            });
        }


    }


})();