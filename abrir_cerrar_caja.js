(function () {
    'use strict';
    var scripts = document.getElementsByTagName("script");
    var currentScriptPath = scripts[scripts.length - 1].src;

    angular.module('' +
            'nombreapp.stock.abrirCerrarCaja', ['ngRoute', 'toastr'
            , 'acMovimientos', 'nombreapp.stock.cajas'])
        .config(['$routeProvider', function ($routeProvider) {
            $routeProvider.when('/abrir_cerrar_caja', {
                templateUrl: currentScriptPath.replace('.js', '.html'),
                controller: 'AbrirCerrarCajaController',
                data: {requiresLogin: true}
            });
        }])
        .controller('AbrirCerrarCajaController', AbrirCerrarCajaController);


    AbrirCerrarCajaController.$inject = ['$routeParams', 'CajasService', 'toastr', '$location', '$window', 'MvUtilsGlobals',
        'ReportesService', 'ContactsService', '$rootScope', 'SucursalesService'];
    function AbrirCerrarCajaController($routeParams, CajasService, toastr, $location, $window, MvUtilsGlobals,
                                       ReportesService, ContactsService, $rootScope, SucursalesService) {

        var vm = this;
        vm.isOpen = true;
        vm.saldoInicial = 0.0;
        vm.saldoFinal = 0.0;
        vm.saldoFinalReal = 0.0;
        vm.detalles = '';
        vm.sucursal_nombre = '';


        vm.save = save;

        SucursalesService.getByParams('sucursal_id', '' + MvUtilsGlobals.sucursal_id, 'true', function (data) {
            vm.sucursal_nombre = data[0].nombre;
        });

        CajasService.checkEstado(MvUtilsGlobals.sucursal_id, MvUtilsGlobals.pos_id, function (data) {
            //console.log(data);

            if (data.asiento_cierre_id == null || data.asiento_cierre_id == 0) {
                vm.isOpen = true;
                vm.saldoInicial = data.saldo_inicial;
                CajasService.getSaldoFinal(MvUtilsGlobals.sucursal_id, MvUtilsGlobals.pos_id, function (data) {
                    vm.saldoFinal = parseFloat(data[0].total) + parseFloat(vm.saldoInicial);
                    vm.saldoFinalReal = parseFloat(data[0].total) + parseFloat(vm.saldoInicial);
                });
            } else {
                vm.isOpen = false;
                CajasService.getSaldoFinalAnterior(MvUtilsGlobals.sucursal_id, MvUtilsGlobals.pos_id, function (data) {
                    console.log(data);
                    vm.saldoInicial = data[0].valor_real;
                    vm.detalles = data[0].detalles;
                });
            }
        });

        function save() {

            if (vm.isOpen) {

                MvUtilsGlobals.isWaiting = true;
                $rootScope.$broadcast('IsWaiting');
                ReportesService.cierreDeCaja(MvUtilsGlobals.sucursal_id, MvUtilsGlobals.pos_id, function (data) {

                    console.log(data);
                    var mensaje = '';
                    mensaje = mensaje + '<b>INGRESOS</b><br><br>';
                    for (var i = 0; i < data[0].length; i++) {

                        if (data[0][i].cuenta_id.indexOf('1.1.1.0') > -1) {
                            mensaje = mensaje + '<div> Caja Chica: ' + data[0][i].importe + '</div><br>'
                        } else if (data[0][i].cuenta_id.indexOf('1.1.1.3') > -1) {
                            mensaje = mensaje + '<div> Ahorro: ' + data[0][i].importe + '</div><br>'
                        }
                        else if (data[0][i].cuenta_id.indexOf('4.1.1.0') > -1){
                            mensaje = mensaje + '<div>Ventas: ' + data[0][i].importe + '</div><br>'
                        }

                    }

                    mensaje = mensaje + '<b>DETALLE DE CAJA</b><br><br>';
                    mensaje = mensaje + '<br>Observaciones: ' + vm.detalles + '<br>';
                    mensaje = mensaje + '<br>Valor esperado: ' + data[1][0].valor_esperado + '<br>';
                    mensaje = mensaje + '<br>Valor real: ' + data[1][0].valor_real + '<br>';
                    mensaje = mensaje + '<br>Saldo Inicial: ' + data[1][0].saldo_inicial + '<br><br><br>';


                    mensaje = mensaje + '<b>EGRESOS</b><br><br>';
                    if (data[3][0] == undefined ||data[3][0].descripcion == 'null') {
                        mensaje = mensaje + '<div>Sin Movimientos</div><br>'
                    } else {
                        for (var i = 0; i < data[3].length; i++) {
                            mensaje = mensaje + '<div>' + data[3][i].descripcion + ': ' + data[3][i].importe + '</div><br>'
                        }
                    }


                    mensaje = mensaje + '<b>DETALLE DE VENTAS</b><br><br>';
                    mensaje = mensaje + '<table><tbody>' +
                        '<tr><td>Producto</td><td>Cantidad Vendida</td></tr>';
                    for (var i = 0; i < data[2].length; i++) {
                        mensaje = mensaje + '<tr><td>' + data[2][i].nombre + '</td><td>' + data[2][i].cantidad + '</td></tr>'
                    }
                    mensaje = mensaje + '</tbody></table>';


                    ContactsService.sendMail(window.mailAdmin,
                        window.mailAdmins,
                        'Cierre de Caja',
                        'Sucursal:' + vm.sucursal_nombre + ' Caja: ' + MvUtilsGlobals.pos_id + ' Fecha: ' + new Date().getDate() + '/' + new Date().getMonth() + '/' + new Date().getFullYear(),
                        mensaje,
                        function (data) {

                            console.log(data);
                            CajasService.cerrarCaja(MvUtilsGlobals.sucursal_id, MvUtilsGlobals.pos_id, vm.saldoFinalReal, vm.detalles, function (data) {


                                MvUtilsGlobals.isWaiting = false;
                                $rootScope.$broadcast('IsWaiting');
                                $location.path('/resumen_caja_diaria');


                            });
                        });
                });

            } else {
                CajasService.abrirCaja(MvUtilsGlobals.sucursal_id, MvUtilsGlobals.pos_id, vm.saldoInicial, function (data) {
                    $location.path('/resumen_caja_diaria');
                })

            }
        }


    }


})();