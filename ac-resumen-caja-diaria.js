(function () {
    'use strict';

    angular.module('acResumenCajaDiaria', [])

        .config(['$routeProvider', function ($routeProvider) {
            $routeProvider.when('/resumen_caja_diaria', {
                templateUrl: './resumen_caja_diaria/resumen_caja_diaria.html',
                controller: 'ResumenCajaDiariaController',
                data: {requiresLogin: true}
            });
        }])

        .component('resumenCajaDiaria', resumenCajaDiaria());
    function resumenCajaDiaria() {
        return {
            bindings: {},
            templateUrl: window.installPath + '/mv-angular-cajas/ac-resumen-caja-diaria.html',
            controller: ResumenCajaDiariaController
        }
    }

    ResumenCajaDiariaController.$inject = ['CajasService', '$location', 'MovimientosService', '$timeout', '$interval', 'AcUtilsGlobals', '$rootScope',
        '$scope', 'UserService', 'SucursalesService'];
    function ResumenCajaDiariaController(CajasService, $location, MovimientosService, $timeout, $interval, AcUtilsGlobals, $rootScope,
                                         $scope, UserService, SucursalesService) {

        var vm = this;
        vm.asientos = [];
        vm.deleteAsiento = deleteAsiento;
        vm.filtroSucursal = filtroSucursal;
        vm.modificarAsiento = modificarAsiento;
        vm.func = func;
        vm.saldoInicial = 0.0;
        vm.saldoFinal = 0.0;
        vm.sucursal = {};
        vm.sucursales = [];
        //vm.sucursal_id = UserService.getFromToken().data.sucursal_id;
        vm.sucursal_id = 1;
        vm.cajaGeneralSucursal = 0.0;


        getSucursales();

        function getSucursales(){
            SucursalesService.get().then(function (data) {
                vm.sucursales = data;
                for(var i=0; i < data.length; i++) {
                    //if(data[i].sucursal_id == UserService.getFromToken().data.sucursal_id){
                    if(data[i].sucursal_id == vm.sucursal_id){
                        vm.sucursal = data[i];
                        func(vm.sucursal);
                        getDetalles(vm.sucursal);
                    }
                }
            });
        }



        $rootScope.$on('refreshResumenCaja', function () {
            getSucursales();
            //func();
        });

        /**
         * Obtengo el total del ahorro del local
         */
            //$timeout(func, 1000);
        //func();

        function func(sucursal) {
            //console.log(sucursal);
            //CajasService.getTotalByCuenta('1.1.1.3' + vm.sucursal_id, vm.sucursal_id, function (data) {
            CajasService.getTotalByCuenta('1.1.1.3' + sucursal.sucursal_id, sucursal.sucursal_id, function (data) {
                //console.log(data);
                if (data[0] == undefined) {

                    vm.cajaGeneralSucursal = 0;
                } else {

                    vm.cajaGeneralSucursal = data[0].importe;
                    //CajasService.getResultado('1.1.1.3' + vm.sucursal_id, function (data) {
                    CajasService.getResultado('1.1.1.3' + sucursal.sucursal_id, function (data) {
                        vm.cajaGeneralSucursal = parseFloat(vm.cajaGeneralSucursal) + parseFloat(data[0].total);
                    });
                }
            });
        }

        function modificarAsiento(asiento_id) {
            $location.path('/cajas/' + asiento_id);
        }


        function filtroSucursal(sucursal) {
            vm.asientos = [];
            getDetalles(sucursal);
        }

        function deleteAsiento(id) {
            var r = confirm('Realmente desea eliminar el movimiento?');

            if (!r) {
                return;
            }
            MovimientosService.deleteAsiento(id, vm.sucursal_id, function (data) {
                //console.log(data);
                vm.asientos = [];
                for(var i=0; i <= vm.sucursales.length;i++){
                    if(vm.sucursales[i].sucursal_id == vm.sucursal_id) {
                        getDetalles(vm.sucursales[i]);
                    }
                }
            });
        }


        function getDetalles(sucursal) {
            AcUtilsGlobals.startWaiting();

            //CajasService.getSaldoInicial(UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, function (data) {
            CajasService.getSaldoInicial(sucursal.sucursal_id, sucursal.pos_cantidad, function (data) {

                vm.saldoInicial = parseFloat(data.replace('"', ''));
                vm.saldoFinal = vm.saldoInicial;

                //CajasService.getCajaDiaria(UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, function (data) {
                CajasService.getCajaDiaria(sucursal.sucursal_id, sucursal.pos_cantidad, function (data) {
                    //console.log(data);
                    var asientos = [];
                    var detalles = [];
                    var asiento = {};

                    for (var i = 0; i < data.length; i++) {
                        for (var x = 0; x < data[i].movimientos.length; x++) {

                            //agrego el movimiento de caja - Estos son los totales que aparecen al final del movimiento

                            if (data[i].movimientos[x].cuenta_id.indexOf('1.1.1.0') > -1 || // Caja chica
                                data[i].movimientos[x].cuenta_id.indexOf('1.1.2.0') > -1 || // Deudores
                                data[i].movimientos[x].cuenta_id.indexOf('1.1.4.0') > -1 || // Tarjeta
                                data[i].movimientos[x].cuenta_id.indexOf('2.1.1.0') > -1 || // Proveedores a deuda
                                data[i].movimientos[x].cuenta_id.indexOf('1.1.1.2') > -1    // CC CA MP ML
                            ) {

                                for (var y = 0; y < data[i].movimientos[x].detalles.length; y++) {
                                    if (data[i].movimientos[x].detalles[y].detalle_tipo_id == '2') {
                                        asiento.detalle = data[i].movimientos[x].detalles[y].texto;
                                    }
                                }

                                if (data[i].movimientos[x].cuenta_id.indexOf('1.1.1.0') > -1) {
                                    vm.saldoFinal += parseFloat(data[i].movimientos[x].importe);
                                    asiento.valor = data[i].movimientos[x].importe;
                                } else {
                                    asiento.valor = '---';
                                }

                                asiento.total = true;
                                asiento.asiento_id = data[i].asiento_id;
                                detalles.push(asiento);
                                asiento = {};
                            }


                            // Agrego el detalle de los movimientos

                            if ((data[i].movimientos[x].cuenta_id.indexOf('1.1.7.0') > -1 && data[i].movimientos[x].importe > 0) || // Compra de mercaderías
                                data[i].movimientos[x].cuenta_id.indexOf('4.1.1.0') > -1) {  // Venta de Productos y/o Servicios
                                var texto = '';
                                var importe_uni = 0;
                                var importe_total = 0;
                                var cantidad = 0;

                                var iva = 0;
                                for (var y = 0; y < data[i].movimientos[x].detalles.length; y++) {



                                    // Detalle de la operación
                                    if (data[i].movimientos[x].detalles[y].detalle_tipo_id == '2') {
                                        var cat = (asiento.detalle != undefined) ? asiento.detalle : '';
                                        asiento.detalle = data[i].movimientos[x].detalles[y].texto + ' ' + cat;
                                    }

                                    // Código de producto
                                    if (data[i].movimientos[x].detalles[y].detalle_tipo_id == '8') {
                                        var cat = (asiento.detalle != undefined) ? asiento.detalle : '';
                                        asiento.detalle = cat + ' ' + data[i].movimientos[x].detalles[y].texto;


                                        for (var o = 0; o < data[i].movimientos.length; o++) {
                                            if (data[i].movimientos[o].cuenta_id.indexOf("2.1.4.09") > -1)// IVA VENTAS
                                            {
                                                var prod_id = 0;
                                                for (var r = 0; r < data[i].movimientos[o].detalles.length; r++) {
                                                    if (data[i].movimientos[o].detalles[r].detalle_tipo_id == '8') {
                                                        prod_id = data[i].movimientos[o].detalles[r].valor;
                                                    }
                                                }

                                                if (data[i].movimientos[x].detalles[y].valor == prod_id) {
                                                    iva = data[i].movimientos[o].importe;
                                                }
                                            }
                                        }


                                    }

                                    //asiento.valor = data[i].movimientos[x].importe;

                                    // Calculo el total del producto, le agrego también su iva
                                    if (data[i].movimientos[x].detalles[y].detalle_tipo_id == '13') {
                                        texto = data[i].movimientos[x].detalles[y].texto;
                                        cantidad = parseInt(data[i].movimientos[x].detalles[y].valor);
                                        importe_total = parseFloat(data[i].movimientos[x].importe);
                                        //asiento.valor = data[i].movimientos[x].detalles[y].texto + ' x ' + ((data[i].movimientos[x].importe / parseInt(data[i].movimientos[x].detalles[y].valor)) + (parseFloat(iva) / parseInt(data[i].movimientos[x].detalles[y].valor))) + ' = ' + (parseFloat(data[i].movimientos[x].importe) + parseFloat(iva));
                                    }

                                }

                                asiento.valor = texto + ' x ' + ((importe_total / cantidad) + (parseFloat(iva) / cantidad)) + ' = ' + (importe_total + parseFloat(iva));
                                detalles.unshift(asiento);
                                asiento = {};
                            }
                        }

                        if (detalles.length > 0) {
                            for (var index = 0; index < detalles.length; index++) {

                                asientos.push(detalles[index]);
                            }
                            detalles = [];
                        }
                    }

                    vm.asientos = asientos;
                    AcUtilsGlobals.stopWaiting();
                });
            });
        }


    }


})
();