(function () {
    'use strict';

    angular.module('' +
            'acAbrirCerrarCaja', [])

        .component('abrirCerrarCaja', abrirCerrarCaja());

    function abrirCerrarCaja() {
        return {
            bindings: {},
            templateUrl: window.installPath + '/ac-angular-cajas/ac-abrir-cerrar-caja.html',
            controller: AbrirCerrarCajaController
        }
    }


    AbrirCerrarCajaController.$inject = ['CajasService', '$location', 'AcUtilsGlobals', 'ReportesService', 'ContactsService',
        '$rootScope', 'UserService', 'SucursalesService', 'StockService', 'EncomiendasService',
        'PedidoService', 'PedidoVars'];
    function AbrirCerrarCajaController(CajasService, $location, AcUtilsGlobals, ReportesService, ContactsService,
                                       $rootScope, UserService, SucursalesService, StockService, EncomiendasService,
                                       PedidoService, PedidoVars) {

        var vm = this;
        vm.isOpen = true;
        vm.saldoInicial = 0.0;
        vm.saldoFinal = 0.0;
        vm.saldoFinalReal = 0.0;
        vm.detalles = '';
        vm.sucursal_nombre = '';


        vm.save = save;

        SucursalesService.get().then(function (data) {
            for (var i in data) {
                if (UserService.getFromToken().data.sucursal_id == data[i].sucursal_id) {
                    vm.sucursal_nombre = data[i].nombre;
                }
            }
        });


        CajasService.checkEstado(UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, function (data) {
            //console.log(data);

            if (data.asiento_cierre_id == null || data.asiento_cierre_id == 0) {
                vm.isOpen = true;
                vm.saldoInicial = data.saldo_inicial;
                CajasService.getSaldoFinal(UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, function (data) {
                    vm.saldoFinal = parseFloat(data[0].total) + parseFloat(vm.saldoInicial);
                    vm.saldoFinalReal = parseFloat(data[0].total) + parseFloat(vm.saldoInicial);
                });
            } else {
                vm.isOpen = false;
                CajasService.getSaldoFinalAnterior(UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, function (data) {
                    vm.saldoInicial = data[0].valor_real;
                    vm.detalles = data[0].detalles;
                });
            }
        });

        function save() {

            if (vm.isOpen) {
                AcUtilsGlobals.startWaiting();

                var aReponer = [];
                StockService.getAReponer(UserService.getFromToken().data.sucursal_id).then(function (reponerData){
                    aReponer = reponerData;
                });

                var encomiendas = [];
                EncomiendasService.get().then(function (encomiendaData) {
                    for (var i = 0; i < encomiendaData.length; i++) {
                        encomiendaData[i].fecha_entrega = (new Date(encomiendaData[i].fecha_entrega)).getDate() + '/' + ((new Date(encomiendaData[i].fecha_entrega)).getMonth() + 1) + '/'+ (new Date(encomiendaData[i].fecha_entrega)).getFullYear();
                    }
                    encomiendaData.sort(function (a, b) {
                        return b.fecha_entrega - a.fecha_entrega;
                    });
                    encomiendas = encomiendaData;
                });

                var pedidos = [];
                PedidoVars.all = false;
                PedidoService.get(function (pedidoData) {
                    pedidos = pedidoData;
                });

                ReportesService.cierreDeCaja(UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, function (data) {
                    var fecha = new Date().getDate() + '/' + (new Date().getMonth() + 1) + '/' + new Date().getFullYear();
                    console.log(data);
                    var mensaje = '';
                    mensaje = mensaje + '<div style="font-family:Arial,sans-serif;font-size:15px;margin:0 auto; width:650px;">';
                    mensaje = mensaje + '<div style="border-style:Solid;border-width:1px; left:-14px; top:-7px;padding: 20px;background-color: #515C4B;">';
                    mensaje = mensaje + '<div style="height:30px;text-align:center;"><label style="font-size: 24px;font-weight: bold;font-style: italic;color:#fff;">Cierre de Caja</label></div>';
                    mensaje = mensaje + '<div style="text-align:center;font-weight: bold;margin:20px 0;color:#fff;">' + vm.sucursal_nombre + ' - Caja: ' + UserService.getFromToken().data.caja_id + ' - ' + fecha + '</div>';
                    mensaje = mensaje + '<div style="text-align:left;font-weight: bold;margin:10px 0;color:#fff;">INGRESOS</div>';
                    mensaje = mensaje + '<table style="width: 100%;color:#333;border-width: 1px;border-color: #515C4B;border-collapse: collapse;">';
                    mensaje = mensaje + '<thead><tr><th style="text-align:left;font-size: 12px;background-color: #fff;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B; text-align: left;color:#293333;">Detalle</th>';
                    mensaje = mensaje + '<th style="text-align:left;font-size: 12px;background-color: #fff;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B; text-align: center;color:#293333;">Monto</th></tr></thead>';
                    mensaje = mensaje + '<tbody>';

                    for (var i = 0; i < data[0].length; i++) {

                        if (data[0][i].cuenta_id.indexOf('1.1.1.0') > -1) {
                            mensaje = mensaje + '<tr>';
                            mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;background-color: #293333;color: #fff;">Caja Inicial (Ma\u00F1ana)</td>';
                            mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;text-align:right;background-color: #293333;color: #fff;">$' + data[0][i].importe + '</td>';
                            mensaje = mensaje + '</tr>';
                        } else if (data[0][i].cuenta_id.indexOf('1.1.1.3') > -1) {
                            mensaje = mensaje + '<tr>';
                            mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;background-color: #293333;color: #fff;">Ahorro</td>';
                            mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;text-align:right;background-color: #293333;color: #fff;">$' + data[0][i].importe + '</td>';
                            mensaje = mensaje + '</tr>';
                        }
                        else if (data[0][i].cuenta_id.indexOf('4.1.1.0') > -1) {
                            mensaje = mensaje + '<tr>';
                            mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;background-color: #293333;color: #fff;">Ventas</td>';
                            mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;text-align:right;background-color: #293333;color: #fff;">$' + data[0][i].importe + '</td>';
                            mensaje = mensaje + '</tr>';
                        }

                    }
                    mensaje = mensaje + '</tbody></table>';

//////////////////////////////////////////// OTRAS CUENTAS /////////////////////////////////////////////////////////////////////////////////
                    mensaje = mensaje + '<div style="margin-top:30px;font-weight: bold;color:#fff;">DETALLE DE VENTAS</div>';
                    mensaje = mensaje + '<table style="width: 100%;color:#333;border-width: 1px;border-color: #515C4B;border-collapse: collapse;">';
                    mensaje = mensaje + '<thead><tr><th style="text-align:left;font-size: 12px;background-color: #fff;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B; text-align: left;color:#293333;">Detalle</th>';
                    mensaje = mensaje + '<th style="text-align:left;font-size: 12px;background-color: #fff;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B; text-align: center;color:#293333;">Monto</th></tr></thead>';
                    mensaje = mensaje + '<tbody>';

                    for (var i = 0; i < data[4].length; i++) {

                        mensaje = mensaje + '<tr>';
                        mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;background-color: #293333;color: #fff;">' + data[4][i].descripcion + '</td>';
                        mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;text-align:right;background-color: #293333;color: #fff;">$' + data[4][i].importe + '</td>';
                        mensaje = mensaje + '</tr>';

                    }
                    mensaje = mensaje + '</tbody></table>';
//////////////////////////////////////////// OTRAS CUENTAS /////////////////////////////////////////////////////////////////////////////////


                    mensaje = mensaje + '<div style="margin-top:30px;font-weight: bold;color:#fff;">DETALLE DE CAJA</div>';
                    mensaje = mensaje + '<div style="margin-top:10px;font-weight: bold;color:#fff;">Observaciones:</div>';
                    mensaje = mensaje + '<p style="color:#fff;">' + vm.detalles + '</p>';

                    mensaje = mensaje + '<table style="width: 100%;color:#333;border-width: 1px;border-color: #515C4B;border-collapse: collapse;">';
                    mensaje = mensaje + '<thead><tr><th style="text-align:left;font-size: 12px;background-color: #fff;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B; text-align: left;color:#293333;">Detalle</th>';
                    mensaje = mensaje + '<th style="text-align:left;font-size: 12px;background-color: #fff;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B; text-align: center;color:#293333;">Monto</th></tr></thead>';
                    mensaje = mensaje + '<tbody><tr>';
                    mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;background-color: #293333;color: #fff;">Valor Esperado</td>';
                    mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;text-align:right;background-color: #293333;color: #fff;">$' + data[1][0].valor_esperado + '</td>';
                    mensaje = mensaje + '</tr><tr>';
                    mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;background-color: #293333;color: #fff;">Valor Real</td>';
                    mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;text-align:right;background-color: #293333;color: #fff;">$' + data[1][0].valor_real + '</td>';
                    mensaje = mensaje + '</tr><tr>';
                    mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;background-color: #293333;color: #fff;">Saldo Inicial (Hoy)</td>';
                    mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;text-align:right;background-color: #293333;color: #fff;">$' + data[1][0].saldo_inicial + '</td>';
                    mensaje = mensaje + '</tr></tbody></table>';

                    mensaje = mensaje + '<div style="text-align:left;font-weight: bold;margin: 30px 0 10px 0;color:#fff;">EGRESOS</div>';
                    if (data[3][0] == undefined || data[3][0].descripcion == 'null') {
                        mensaje = mensaje + '<div style="font-weight: bold;color: #a2b154;">Sin Movimientos</div><br>';
                    } else {
                        mensaje = mensaje + '<table style="width: 100%;color:#333;border-width: 1px;border-color: #515C4B;border-collapse: collapse;">';
                        mensaje = mensaje + '<thead><tr>';
                        mensaje = mensaje + '<th style="text-align:left;font-size: 12px;background-color: #fff;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B; text-align: left;color:#293333;">Tipo</th>';
                        mensaje = mensaje + '<th style="text-align:left;font-size: 12px;background-color: #fff;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B; text-align: left;color:#293333;">Descripcion</th>';
                        mensaje = mensaje + '<th style="text-align:left;font-size: 12px;background-color: #fff;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B; text-align: center;color:#293333;">Monto</th>';
                        mensaje = mensaje + '</tr></thead><tbody>';
                        for (var i = 0; i < data[3].length; i++) {
                            mensaje = mensaje + '<tr>';
                            mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;background-color: #293333;color: #fff;">Gasto</td>';
                            mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;background-color: #293333;color: #fff;">' + data[3][i].descripcion + '</td>';
                            mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;text-align:right;background-color: #293333;color: #fff;">$' + data[3][i].importe + '</td>';
                            mensaje = mensaje + '</tr>';
                        }
                        mensaje = mensaje + '</tbody></table>';
                    }

                    ////////////////////////////PRODUCTOS A REPONER/////////////////////////////////////////
                    mensaje = mensaje + '<div style="text-align:left;font-weight: bold;margin: 30px 0 10px 0;color: #fff;">PRODUCTOS A REPONER</div>';
                    mensaje = mensaje + '<table style="width: 100%;color:#333;border-width: 1px;border-color: #515C4B;border-collapse: collapse;">';
                    mensaje = mensaje + '<thead><tr>';
                    mensaje = mensaje + '<th style="text-align:left;font-size:12px;background-color:#fff;border-width:1px;padding:8px;border-style:solid;border-color:#515c4b;text-align:left;color:#293333">Nombre</th>';
                    mensaje = mensaje + '<th style="text-align:center!important;font-size:12px;background-color:#fff;border-width:1px;padding:8px;border-style:solid;border-color:#515c4b;text-align:left;color:#293333">Cantidad Actual</th>';
                    mensaje = mensaje + '<th style="text-align:center!important;font-size:12px;background-color:#fff;border-width:1px;padding:8px;border-style:solid;border-color:#515c4b;text-align:center;color:#293333">Punto de Repos.</th>';
                    mensaje = mensaje + '</tr></thead><tbody>';
                    for (var i = 0; i < aReponer.length; i++) {
                        mensaje = mensaje + '<tr>';
                        mensaje = mensaje + '<td style="font-size:12px;border-width:1px;padding:8px;border-style:solid;border-color:#515c4b;background-color:#293333;color:#fff">' + aReponer[i].nombre + '</td>';
                        mensaje = mensaje + '<td style="font-size:12px;border-width:1px;padding:8px;border-style:solid;border-color:#515c4b;text-align:center;background-color:#293333;color:#fff">' + aReponer[i].cant_actual + '</td>';
                        mensaje = mensaje + '<td style="font-size:12px;border-width:1px;padding:8px;border-style:solid;border-color:#515c4b;text-align:right;background-color:#293333;color:#fff">' + aReponer[i].pto_repo + '</td>';
                        mensaje = mensaje + '</tr>';
                    }
                    mensaje = mensaje + '</tbody></table>';

                    ////////////////////////////ENCOMIENDAS PENDIENTES/////////////////////////////////////////
                    mensaje = mensaje + '<div style="text-align:left;font-weight: bold;margin: 30px 0 10px 0;color: #fff;">ENCOMIENDAS PENDIENTES</div>';
                    mensaje = mensaje + '<table style="width: 100%;color:#333;border-width: 1px;border-color: #515C4B;border-collapse: collapse;">';
                    mensaje = mensaje + '<thead><tr>';
                    mensaje = mensaje + '<th style="text-align:left;font-size:12px;background-color:#fff;border-width:1px;padding:8px;border-style:solid;border-color:#515c4b;text-align:left;color:#293333">Nombre</th>';
                    mensaje = mensaje + '<th style="text-align:left;font-size:12px;background-color:#fff;border-width:1px;padding:8px;border-style:solid;border-color:#515c4b;text-align:center;color:#293333">Fecha Entrega</th>';
                    mensaje = mensaje + '</tr></thead><tbody>';
                    for (var i = 0; i < encomiendas.length; i++) {
                        mensaje = mensaje + '<tr>';
                        mensaje = mensaje + '<td style="font-size:12px;border-width:1px;padding:8px;border-style:solid;border-color:#515c4b;background-color:#293333;color:#fff">' + encomiendas[i].cliente + '</td>';
                        mensaje = mensaje + '<td style="font-size:12px;border-width:1px;padding:8px;border-style:solid;border-color:#515c4b;text-align:center;background-color:#293333;color:#fff">' + encomiendas[i].fecha_entrega + '</td>';
                        mensaje = mensaje + '</tr>';
                    }
                    mensaje = mensaje + '</tbody></table>';

                    ////////////////////////////PEDIDOS PENDIENTES/////////////////////////////////////////
                    mensaje = mensaje + '<div style="text-align:left;font-weight: bold;margin: 30px 0 10px 0;color: #fff;">PEDIDOS PENDIENTES</div>';
                    mensaje = mensaje + '<table style="width: 100%;color:#333;border-width: 1px;border-color: #515C4B;border-collapse: collapse;">';
                    mensaje = mensaje + '<thead><tr>';
                    mensaje = mensaje + '<th style="text-align:left;font-size:12px;background-color:#fff;border-width:1px;padding:8px;border-style:solid;border-color:#515c4b;text-align:left;color:#293333">Nombre</th>';
                    mensaje = mensaje + '<th style="text-align:left;font-size:12px;background-color:#fff;border-width:1px;padding:8px;border-style:solid;border-color:#515c4b;text-align:center;color:#293333">Fecha Pedido</th>';
                    mensaje = mensaje + '</tr></thead><tbody>';
                    for (var i = 0; i < pedidos.length; i++) {
                        mensaje = mensaje + '<tr>';
                        mensaje = mensaje + '<td style="font-size:12px;border-width:1px;padding:8px;border-style:solid;border-color:#515c4b;background-color:#293333;color:#fff">' + pedidos[i].proveedor_nombre + '</td>';
                        mensaje = mensaje + '<td style="font-size:12px;border-width:1px;padding:8px;border-style:solid;border-color:#515c4b;text-align:center;background-color:#293333;color:#fff">' + pedidos[i].fecha_pedido + '</td>';
                        mensaje = mensaje + '</tr>';
                    }
                    mensaje = mensaje + '</tbody></table>';

                    ////////////////////////////DETALLE DE VENTAS/////////////////////////////////////////
                    mensaje = mensaje + '<div style="text-align:left;font-weight: bold;margin: 30px 0 10px 0;color: #fff;">DETALLE DE VENTAS</div>';
                    mensaje = mensaje + '<table style="width: 100%;color:#333;border-width: 1px;border-color: #515C4B;border-collapse: collapse;">';
                    mensaje = mensaje + '<thead><tr>';
                    mensaje = mensaje + '<th style="text-align:left;font-size: 12px;background-color: #fff;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B; text-align: left;color:#293333;">Producto</th>';
                    mensaje = mensaje + '<th style="text-align:left;font-size: 12px;background-color: #fff;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B; text-align: center;color:#293333;">Cantidad Vendida</th>';
                    mensaje = mensaje + '</tr></thead><tbody>';
                    for (var i = 0; i < data[2].length; i++) {
                        mensaje = mensaje + '<tr>';
                        mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;background-color: #293333;color: #fff;">' + data[2][i].nombre + '</td>';
                        mensaje = mensaje + '<td style="font-size: 12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #515C4B;text-align:right;background-color: #293333;color: #fff;">' + data[2][i].cantidad + '</td>';
                        mensaje = mensaje + '</tr>';
                    }
                    mensaje = mensaje + '</tbody></table>';

                    mensaje = mensaje + '</div>';

                    ContactsService.sendMail(window.mailAdmin,
                        window.mailAdmins,
                        'Cierre de Caja',
                        'Sucursal:' + vm.sucursal_nombre + ' Caja: ' + UserService.getFromToken().data.caja_id + ' Fecha: ' + new Date().getDate() + '/' + (new Date().getMonth() + 1) + '/' + new Date().getFullYear(),
                        mensaje,
                        function (data) {

                            console.log(data);
                            var detalles = vm.detalles.replace(/["']/g, " ");
                            CajasService.cerrarCaja(UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, vm.saldoFinalReal, detalles, function (data) {


                                AcUtilsGlobals.stopWaiting();
                                $location.path('/caja/cobros');


                            });
                        });
                });

            } else {
                CajasService.abrirCaja(UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, vm.saldoInicial, function (data) {
                    $location.path('/caja/cobros');
                })

            }
        }


    }


})();