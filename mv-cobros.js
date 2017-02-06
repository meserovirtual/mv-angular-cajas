(function () {
    'use strict';

    angular.module('mvCobros', ['ngRoute'])

        .component('mvCobros', MvCobros());

    function MvCobros() {
        return {
            bindings: {},
            templateUrl: window.installPath + '/mv-angular-cajas/mv-cobros.html',
            controller: MvCobrosController
        }
    }


    MvCobrosController.$inject = ['StockService', 'UserService', 'AcUtils', 'AcUtilsGlobals', '$scope', '$rootScope', 'MovimientosService', 'MovimientoStockFinal', 'StockVars', 'HelperService'];
    function MvCobrosController(StockService, UserService, AcUtils, AcUtilsGlobals, $scope, $rootScope, MovimientosService, MovimientoStockFinal, StockVars, HelperService) {

        var vm = this;
        vm.tipo_precio = '0';
        vm.cliente = {};
        vm.producto = {};
        vm.detalle = {};
        vm.detalles = [];
        vm.total = 0.0;
        vm.forma_pago = '01';
        vm.forma_de_pago_1 = '01';
        vm.forma_de_pago_2 = '02';
        vm.desc_porc = 0;
        vm.desc_cant = 0;
        vm.a_cobrar = 0;
        vm.paga_con = 0;
        vm.vuelto = 0;
        vm.paga_con_x = 0;
        vm.paga_con_y = 0;
        vm.descuento = 0;

        vm.agregarDetalle = agregarDetalle;
        vm.removeDetalle = removeDetalle;
        vm.save = save;
        vm.calc_a_cobrar = calc_a_cobrar;
        vm.encomienda = encomienda;
        vm.calcularTotal = calcularTotal;
        vm.validateMonto = validateMonto;
        vm.aCuenta = aCuenta;


        var elemCaja = angular.element(document.querySelector('#cobros'));

        $scope.$on('$locationChangeStart', function () {

            elemCaja.unbind('keydown');
            elemCaja.unbind('keyup');
        });


        var map = {17: false, 18: false, 80: false};
        elemCaja.bind('keydown', function (e) {
            if (e.keyCode in map) {
                map[e.keyCode] = true;
                if (map[17] && map[18] && map[80]) {
                    save();
                }
            }
        });
        elemCaja.bind('keyup', function (e) {
            if (e.keyCode in map) {
                map[e.keyCode] = false;
            }
        });


        document.getElementById('searchProducto').getElementsByTagName('input')[0].addEventListener('keyup', function (event) {
            if (event.keyCode == 13) {
                var el = document.getElementById('cantidad');
                if (el != null) {
                    el.focus();
                }
            }
        });

        function validateMonto() {
            if(vm.paga_con_x < 0){
                AcUtils.showMessage('error', 'El valor ingresado es mayor al monto que se debe cobrar');
                vm.paga_con_x = 0;
                vm.paga_con_y = vm.total;
            }

        }

        function agregarDetalle() {
            console.log(vm.producto);

            if (vm.producto.producto_tipo == 3) {
                vm.cantidad = 1;
            }

            if (vm.cantidad == undefined || vm.cantidad <= 0) {
                alert('Ingreso una cantidad menor o igual a 0. Corrija el valor');
                return;
            }

            if (vm.producto.producto_id === undefined || vm.producto.producto_id == -1
                || vm.producto.producto_id == '' || isNaN(vm.producto.producto_id) || vm.producto.producto_id == null
                || vm.producto.producto_id < 1) {
                AcUtils.showMessage('error', 'Debe seleccionar un producto');
                return;
            }


            if (!validarCantidad(vm.producto, vm.cantidad)) {
                return;
            }

            var encontrado = false;
            for (var i = 0; i < vm.detalles.length; i++) {
                if (vm.producto.producto_id == vm.detalles[i].producto_id) {

                    // El producto 99999 es reservado para los gastos de envío, es un servicio que no se crea como tal en la base.
                    if (vm.producto.producto_id == 99999) {
                        return;
                    }

                    if (!validarCantidad(vm.producto, parseInt(vm.detalles[i].cantidad) + parseInt(vm.cantidad))) {
                        return;
                    }

                    vm.detalles[i].cantidad = parseInt(vm.detalles[i].cantidad) + parseInt(vm.cantidad);
                    if (vm.producto.producto_tipo == 3) {
                        vm.detalles[i].precio_total = parseInt(vm.detalles[i].precio_total) + parseFloat(vm.producto.precios[0].precio);
                    } else {
                        vm.detalles[i].precio_total = parseInt(vm.detalles[i].cantidad) * parseFloat(vm.detalles[i].precio_unidad);
                    }

                    encontrado = true;
                }
            }

            var prod = angular.copy(vm.producto);


            if (!encontrado) {
                vm.detalle = {
                    producto_id: prod.producto_id,
                    sku: prod.sku,
                    producto_nombre: prod.nombre,
                    cantidad: vm.cantidad,
                    precio_unidad: ((prod.precios[vm.tipo_precio] != undefined) ? prod.precios[vm.tipo_precio].precio : prod.precios[0].precio),
                    precio_total: parseInt(vm.cantidad) * parseFloat(((prod.precios[vm.tipo_precio] != undefined) ? prod.precios[vm.tipo_precio].precio : prod.precios[0].precio)),
                    stock: prod.stocks,
                    productos_kit: prod.kits,
                    productos_tipo: prod.producto_tipo,
                    mp: false,
                    iva: prod.iva
                };

                vm.detalles.push(vm.detalle);
            }

            //console.log(vm.detalles);

            vm.producto = {};
            //vm.producto.fotos == undefined;
            var el = document.getElementById('searchProducto').getElementsByTagName('input');
            if (el[0] != null) {
                el[0].focus();
                el[0].value = '';
            }

            vm.cantidad = undefined;
            calcularTotal();
            var elem = angular.element(document.querySelector('#txtSearchId'));
            //elem[0].focus();
            vm.searchProductText = '';
            vm.listaProductos = [];
            //var elem = document.getElementById('producto-search');
            //elem.focus();
            elem.value = '';
        }

        function validarCantidad(producto, cantidad) {
            if (producto.producto_tipo == 0) {
                var total_en_suc = 0;
                for (var i in producto.stocks) {
                    total_en_suc += producto.stocks[i].cant_actual;
                }

                if (cantidad > total_en_suc) {
                    AcUtils.showMessage('error', 'Solo quedan ' + total_en_suc + ' productos');
                    return false;
                }
            }

            if (producto.producto_tipo == 2) {

                var prod_id = -1;
                var cant_actual = -1;
                var aux_cant = -1;
                for (var x in vm.producto.kits) {
                    aux_cant = 0;
                    for (var i in vm.producto.kits[x].stocks) {
                        aux_cant += vm.producto.kits[x].stocks[i].cant_actual;
                    }
                    if (prod_id == -1 || aux_cant < cant_actual) {
                        prod_id = vm.producto.kits[x].producto_id;
                        cant_actual = aux_cant;
                    }
                }


                if (cantidad > cant_actual) {
                    AcUtils.showMessage('error', 'Solo se pueden armar solo ' + cant_actual + ' kits.');
                    return false;
                }
            }

            if (producto.producto_tipo == 3) {
                return true;
            }
            return true;
        }

        function removeDetalle(index) {
            var r = confirm('Realmente desea eliminar el producto del pedido?');
            if (r) {
                //vm.total = parseFloat(vm.total) - parseFloat(vm.detalles[index].precio_total);
                vm.detalles.splice(index, 1);
                //quitarMP(index);
            }

            calcularTotal();
        }

        function calcularTotal() {

            vm.total = 0.0;



            //if (vm.forma_pago == '08' || vm.forma_pago == '09' || vm.forma_pago == '10') {
            if (vm.forma_pago_1 == '08' || vm.forma_pago_1 == '09' || vm.forma_pago_1 == '10' ||
                vm.forma_pago_2 == '08' || vm.forma_pago_2 == '09' || vm.forma_pago_2 == '10') {

                for (var i = 0; i < vm.detalles.length; i++) {
                    vm.total = parseFloat(vm.total) + parseFloat(vm.detalles[i].precio_total);
                    vm.detalles[i].precio_unidad = Math.round((parseFloat(vm.detalles[i].precio_total) / vm.detalles[i].cantidad) * 100) / 100;
                }

            } else {

                for (var i = 0; i < vm.detalles.length; i++) {
                    if (!vm.detalles[i].mp) {
                        vm.total = parseFloat(vm.total) + parseFloat(vm.detalles[i].precio_total);
                    }
                }

            }
            calc_a_cobrar('cant');
        }

        function calc_a_cobrar(origen) {

            if (vm.desc_cant === null) {
                vm.desc_cant = 0;
            }
            if (vm.desc_porc === null) {
                vm.desc_porc = 0;
            }

            if (origen === 'porc') {
                if (vm.desc_porc > 0) {
                    vm.a_cobrar = vm.total - (vm.total * vm.desc_porc) / 100;
                    vm.desc_cant = vm.total - vm.a_cobrar;
                    vm.descuento = vm.desc_porc * 100;
                } else {
                    vm.a_cobrar = vm.total;
                    vm.desc_cant = 0;
                    vm.descuento = 0;
                }
            } else {

                if (vm.desc_cant > 0) {
                    vm.a_cobrar = vm.total - vm.desc_cant;
                    vm.desc_porc = (vm.desc_cant * 100) / vm.total;
                    vm.descuento = vm.desc_cant;
                } else {
                    vm.a_cobrar = vm.total;
                    vm.desc_porc = 0;
                    vm.descuento = 0;
                }
            }


            vm.paga_con_x = vm.total;
            vm.paga_con_y = 0;

            //vm.vuelto = (vm.paga_con > 0 && vm.paga_con !== null) ? vm.a_cobrar - vm.paga_con : 0;
            if(vm.paga_con_x > 0 && vm.paga_con_x !== null)
                vm.vuelto = vm.a_cobrar - vm.paga_con_x - ((vm.paga_con_y > 0 && vm.paga_con_y !== null) ? vm.paga_con_y : 0);
            else if(vm.paga_con_y > 0 && vm.paga_con_y !== null)
                vm.vuelto = vm.a_cobrar - vm.paga_con_y - ((vm.paga_con_x > 0 && vm.paga_con_x !== null) ? vm.paga_con_x : 0);
            else
                vm.vuelto = 0;

        }

        function save() {
            if (vm.detalles.length < 1) {
                AcUtils.showMessage('error', 'No hay productos seleccionados');
                return;
            }

            AcUtilsGlobals.startWaiting();
            //var usuario_id = -1;
            if (vm.cliente !== undefined && vm.cliente.usuario_id !== undefined) {
                vm.usuario_id = vm.cliente.usuario_id;
            } else {
                if (vm.cliente.nombre !== '') {
                    if (AcUtils.validateEmail(vm.cliente.nombre)) {
                        vm.cliente = {
                            nombre: '',
                            apellido: '',
                            mail: vm.cliente.nombre,
                            nacionalidad_id: '',
                            tipo_doc: 0,
                            nro_doc: '',
                            comentarios: '',
                            marcado: 0,
                            fecha_nacimiento: ''
                        };
                        UserService.create(vm.cliente).then(function (data) {
                            vm.usuario_id = data;
                            finalizarVenta();
                        });
                    }
                } else {
                    finalizarVenta();
                }

            }
            finalizarVenta();


        }

        function finalizarVenta() {
            var forma_pagos = [];
            if(vm.paga_con_x > 0 && vm.paga_con_x !== null){
                forma_pagos.push({forma_pago: vm.forma_de_pago_1, importe: vm.paga_con_x});
            }
            if(vm.paga_con_y > 0 && vm.paga_con_y !== null){
                forma_pagos.push({forma_pago: vm.forma_de_pago_2, importe: vm.paga_con_y});
            }
            console.log(forma_pagos);
            //console.log(vm.detalles);
            //return;
            //(tipo_asiento, subtipo_asiento, sucursal_id, forma_pago, transferencia_desde, total, descuento, detalle, items, usuario_id, usuario_id, comentario, callback)
            //MovimientosService.armarMovimiento('001', '00', UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, vm.forma_pago, '00', vm.total, vm.desc_cant, 'Venta de Caja', vm.detalles, vm.usuario_id, 1, vm.comentario,
            MovimientosService.armarMovimiento('001', '00', UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, forma_pagos, '00', vm.total, vm.desc_cant, 'Venta de Caja', vm.detalles, vm.usuario_id, 1, vm.comentario,
                function (data) {

                    var helper_obj = {
                        asiento_id : data,
                        detalles : vm.detalles,
                        despues : MovimientoStockFinal.stocks_finales
                    };

                    console.log(helper_obj);

                    HelperService.create(helper_obj).then(function(data){
                        console.log(data);
                    });

                    //console.log(MovimientoStockFinal.stocks_finales);
                    StockService.update(MovimientoStockFinal.stocks_finales).then(function (data) {
                        AcUtils.showMessage('success', 'Venta realizada con éxito.');
                        vm.detalles = [];
                        vm.cliente = {};

                        vm.forma_pago = '01';
                        vm.desc_porc = 0;
                        vm.desc_cant = 0;
                        vm.a_cobrar = 0;
                        vm.paga_con = 0;
                        vm.vuelto = 0;
                        vm.total = 0;
                        vm.forma_de_pago_1 = '01';
                        vm.forma_de_pago_2 = '02';
                        vm.paga_con_x = 0;
                        vm.paga_con_y = 0;

                        //ProductVars.clearCache = true;
                        //ProductService.get(function (data) {
                        //});

                        vm.producto = {};
                        var el = document.getElementById('searchCliente').getElementsByTagName('input');
                        if (el[0] != null) {
                            el[0].value = '';
                        }

                        vm.tipo_precio = '0';

                        StockVars.clearCache = true;
                        StockService.get(function (data) {

                        });

                        $rootScope.$broadcast('refreshResumenCaja');
                        AcUtilsGlobals.stopWaiting();
                    });
                    //console.log(data);
                });
        }

        function encomienda() {
            if (vm.cliente == undefined || vm.cliente.usuario_id == undefined) {
                AcUtils.showMessage('error', 'Debe seleccionar un cliente para poder generar una encomienda');
                return;
            }
            if (vm.detalles.length < 1) {
                AcUtils.showMessage('error', 'No hay productos seleccionados');
                return;
            }
            vm.showEncomienda = true;
        }


        // Funciones para Autocomplete
        vm.searchClientes = searchClientes;
        vm.searchProducto = searchProducto;

        function searchProducto(callback) {
            StockService.get().then(callback);
        }

        function searchClientes(callback) {
            UserService.get().then(callback);
        }

        /**
         * Cobro a Cuenta del cliente
         */
        function aCuenta() {
            /*
            if (vm.detalles.length < 1) {
                AcUtils.showMessage('error', 'No hay productos seleccionados');
                return;
            }

            AcUtilsGlobals.startWaiting();
            //var usuario_id = -1;
            if (vm.cliente !== undefined && vm.cliente.usuario_id !== undefined) {
                vm.usuario_id = vm.cliente.usuario_id;

                //(tipo_asiento, subtipo_asiento, sucursal_id, forma_pago, transferencia_desde, total, descuento, detalle, items, usuario_id, usuario_id, comentario, callback)
                MovimientosService.armarMovimiento('001', '00', UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, '07', '00', vm.total, vm.desc_cant, 'Venta Productos - Ingreso a Deudores', vm.detalles, vm.usuario_id, 1, '',
                    function (data) {
                        //console.log(MovimientoStockFinal.stocks_finales);
                        //ConsultaStockService.updateStock(MovimientoStockFinal.stocks_finales, function (data) {
                        StockService.update(MovimientoStockFinal.stocks_finales).then(function (data) {
                            vm.cliente.saldo = vm.cliente.saldo - parseFloat(vm.total);
                            UserService.update(vm.cliente).then(function (data) {
                                //if (!isNaN(data) && data > -1) {
                                vm.detalles = [];
                                vm.cliente = {};

                                    vm.forma_pago = '01';
                                    vm.desc_porc = 0;
                                    vm.desc_cant = 0;
                                    vm.a_cobrar = 0;
                                    vm.paga_con = 0;
                                    vm.vuelto = 0;
                                    vm.total = 0;
                                    vm.forma_de_pago_1 = '01';
                                    vm.forma_de_pago_2 = '02';
                                    vm.paga_con_x = 0;
                                    vm.paga_con_y = 0;

                                    AcUtils.showMessage('success', 'Venta realizada con éxito.');
                                //} else {
                                //    AcUtils.showMessage('error', 'Error al realizar la venta');
                                //}
                            }).catch(function(data){
                                console.log(data);
                                AcUtils.showMessage('error', 'Error al realizar la venta');
                            });

                            vm.producto = {};
                            var el = document.getElementById('searchCliente').getElementsByTagName('input');
                            if (el[0] != null) {
                                el[0].value = '';
                            }

                            vm.tipo_precio = '0';

                            StockVars.clearCache = true;
                            StockService.get(function (data) {
                            });

                            $rootScope.$broadcast('refreshResumenCaja');
                            AcUtilsGlobals.stopWaiting();

                        });
                        //console.log(data);
                    });
            } else {
                AcUtils.showMessage('error', 'Debe seleccionar un cliente');
                return;
            }
            */
        }


    }

})();
