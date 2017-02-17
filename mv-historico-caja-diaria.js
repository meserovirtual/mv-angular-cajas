(function () {
    'use strict';

    angular.module('mvHistoricoCajaDiaria', [])

        .config(['$routeProvider', function ($routeProvider) {
            $routeProvider.when('/historico_caja_diaria', {
                templateUrl: './historico_caja_diaria/historico_caja_diaria.html',
                controller: 'HistoricoCajaDiariaController',
                data: {requiresLogin: true}
            });
        }])

        .component('historicoCajaDiaria', historicoCajaDiaria());
    function historicoCajaDiaria() {
        return {
            bindings: {},
            templateUrl: window.installPath + '/mv-angular-cajas/mv-historico-caja-diaria.html',
            controller: HistoricoCajaDiariaController
        }
    }

    HistoricoCajaDiariaController.$inject = ['CajasService', '$location', 'MovimientosService', '$timeout', '$interval', 'MvUtilsGlobals', '$rootScope',
        '$scope', 'UserService', 'SucursalesService', 'MvUtils'];
    function HistoricoCajaDiariaController(CajasService, $location, MovimientosService, $timeout, $interval, MvUtilsGlobals, $rootScope,
                                           $scope, UserService, SucursalesService, MvUtils) {

        var vm = this;
        vm.sucursal = {};
        vm.sucursales = [];
        vm.sucursal_id = UserService.getFromToken().data.sucursal_id;
        vm.cajaGeneralSucursal = 0.0;
        vm.cajas = {};
        vm.caja = [];
        vm.asientos = [];
        vm.saldoInicial = 0.0;
        vm.saldoFinal = 0.0;
        vm.totalVentas = 0.0;

        //FUNCIONES
        vm.getCajasBySucursal = getCajasBySucursal;
        //vm.filtroSucursal = filtroSucursal;
        vm.getDetalles = getDetalles;
        vm.clearDetalles = clearDetalles;
        vm.func = func;

        getSucursales();

        function getSucursales() {
            SucursalesService.get().then(function (data) {
                vm.sucursales = data;
                vm.sucursal = data[0];
                //func(vm.sucursal);
                getCajasBySucursal(vm.sucursal.sucursal_id);
            });
        }

        function getCajasBySucursal(sucursal_id) {
            CajasService.getCajasBySucursal(sucursal_id, 1).then(function (data) {
                vm.cajas = data;
                vm.caja = data[0];
                func(vm.sucursal);
                getDetalles(vm.sucursal, vm.caja);
            }).catch(function(data){
                console.log(data);
            });
        }


        function func(sucursal) {
            //console.log(sucursal);
            //CajasService.getTotalByCuenta('1.1.1.3' + vm.sucursal_id, vm.sucursal_id, function (data) {
            CajasService.getTotalByCuenta('1.1.1.3' + sucursal.sucursal_id, sucursal.sucursal_id).then(function (data) {
                if (data[0] == undefined) {
                    vm.cajaGeneralSucursal = 0;
                } else {
                    vm.cajaGeneralSucursal = data[0].importe;
                    //CajasService.getResultado('1.1.1.3' + vm.sucursal_id, function (data) {
                    CajasService.getResultado('1.1.1.3' + sucursal.sucursal_id).then(function (data) {
                        console.log(data);
                        vm.cajaGeneralSucursal = parseFloat(vm.cajaGeneralSucursal) + parseFloat(data.data[0].total);
                    }).catch(function(data){
                        console.log(data);
                    });
                }
            }).catch(function(data){
                console.log(data);
            });
        }

        /*
         function filtroSucursal(sucursal) {
         vm.asientos = [];
         getDetalles(sucursal);
         }
         */

        function clearDetalles() {
            vm.asientos = [];
            vm.saldoInicial = 0.0;
            vm.saldoFinal = 0.0;
            vm.totalVentas = 0.0;
        }

        function getDetalles(sucursal, caja) {
            if(caja == undefined || caja.length == 0) {
                MvUtils.showMessage('warning', "No hay caja para mostrar detalle");
                return;
            }

            MvUtilsGlobals.startWaiting();

            clearDetalles();
            vm.saldoInicial = parseFloat(caja.saldo_inicial);
            //vm.saldoInicial = parseFloat(vm.caja.saldo_inicial);
            vm.saldoFinal = parseFloat(caja.saldo_inicial);

            CajasService.getCajaDiariaFromTo(sucursal.sucursal_id, 1, caja.asiento_inicio_id, caja.asiento_cierre_id).then(function (data) {
                console.log(data);
                var asiento = [];
                for (var i = 0; i < data.data.length; i++) {
                    if (data.data[i].cuenta_id.indexOf('1.1.1.0') > -1) {
                        //vm.saldoInicial += parseFloat(data[i].importe);
                        vm.saldoFinal += parseFloat(data.data[i].importe);
                    }
                    if (data.data[i].cuenta_id.indexOf('1.1.1.0') > -1 && data.data[i].detalles[0].detalle.indexOf('Caja Chica: Movimiento entre cuentas')) {
                        vm.totalVentas += parseFloat(data.data[i].importe);
                    }

                    if (i > 0 && data.data[i - 1].asiento_id == data.data[i].asiento_id) {
                        asiento.push(data.data[i]);
                    } else {
                        if (asiento.length > 0) {
                            vm.asientos.push(asiento);
                        }
                        asiento = [];
                        asiento.push(data.data[i]);
                    }
                }

                if (asiento.length > 0) {
                    vm.asientos.push(asiento);
                }
                MvUtilsGlobals.stopWaiting();
            }).catch(function(data){
                console.log(data);
            });
        }

    }

})();