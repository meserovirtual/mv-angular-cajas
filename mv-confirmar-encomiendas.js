(function () {
    'use strict';

    angular.module('mvEncomiendas', ['ngRoute'])

        .component('mvEncomiendas', MvEncomiendas());

    function MvEncomiendas() {
        return {
            bindings: {},
            templateUrl: window.installPath + '/mv-angular-cajas/mv-encomiendas.html',
            controller: MvEncomiendasController
        }
    }


    MvEncomiendasController.$inject = ['StockService', 'UserService', 'MvUtils', 'MvUtilsGlobals', '$scope', '$rootScope', 'MovimientosService', 'MovimientoStockFinal', 'StockVars'];
    function MvEncomiendasController(StockService, UserService, MvUtils, MvUtilsGlobals, $scope, $rootScope, MovimientosService, MovimientoStockFinal, StockVars) {

        var vm = this;
        vm.tipo_precio = '0';
        vm.cliente = {};
        vm.producto = {};
        vm.detalle = {};
        vm.detalles = [];
        vm.total = 0.0;
        vm.forma_pago = '01';
        vm.desc_porc = 0;
        vm.desc_cant = 0;
        vm.a_cobrar = 0;
        vm.paga_con = 0;
        vm.vuelto = 0;

        vm.agregarDetalle = agregarDetalle;
        vm.removeDetalle = removeDetalle;
        vm.save = save;
        vm.calc_a_cobrar = calc_a_cobrar;


        var elemCaja = angular.element(document.querySelector('#encomiendas'));

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

        function agregarDetalle() {

            if (vm.producto.producto_tipo == 3) {
                vm.cantidad = 1;
            }

            if (vm.cantidad == undefined || vm.cantidad == 0) {
                return;
            }

            if (vm.producto.producto_id === undefined || vm.producto.producto_id == -1
                || vm.producto.producto_id == '' || isNaN(vm.producto.producto_id) || vm.producto.producto_id == null
                || vm.producto.producto_id < 1) {
                MvUtils.showMessage('error', 'Debe seleccionar un producto');
                return;
            }


            if (!validarCantidad(vm.producto, vm.cantidad)) {
                return;
            }

            var encontrado = false;
            for (var i = 0; i < vm.detalles.length; i++) {
                if (vm.producto.producto_id == vm.detalles[i].producto_id) {

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
                    precio_unidad: prod.precios[vm.tipo_precio].precio,
                    precio_total: parseInt(vm.cantidad) * parseFloat(prod.precios[vm.tipo_precio].precio),
                    stock: prod.stocks,
                    productos_kit: prod.kits,
                    mp: false,
                    iva: prod.iva
                };

                vm.detalles.push(vm.detalle);
            }

        }

        function save() {

            if (vm.detalles.length < 1) {
                MvUtils.showMessage('error', 'No hay productos seleccionados');
                return;
            }

            MvUtilsGlobals.startWaiting();
            //var usuario_id = -1;
            if (vm.cliente !== undefined && vm.cliente.usuario_id !== undefined) {
                vm.usuario_id = vm.cliente.usuario_id;
            } else {
                if (vm.cliente.nombre !== '') {
                    if (MvUtils.validateEmail(vm.cliente.nombre)) {
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
            //console.log(vm.detalles);
            //return;
            //(tipo_asiento, subtipo_asiento, sucursal_id, forma_pago, transferencia_desde, total, descuento, detalle, items, usuario_id, usuario_id, comentario, callback)
            MovimientosService.armarMovimiento('001', '00', UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, vm.forma_pago, '00', vm.total, vm.desc_cant, 'Venta de Caja', vm.detalles, vm.usuario_id, 1, vm.comentario,
                function (data) {

                    //console.log(MovimientoStockFinal.stocks_finales);
                    StockService.update(MovimientoStockFinal.stocks_finales).then(function (data) {
                        MvUtils.showMessage('success', 'Venta realizada con éxito.');
                        vm.detalles = [];
                        vm.cliente = {};

                        vm.forma_pago = '01';
                        vm.desc_porc = 0;
                        vm.desc_cant = 0;
                        vm.a_cobrar = 0;
                        vm.paga_con = 0;
                        vm.vuelto = 0;
                        vm.total = 0;

                        //ProductVars.clearCache = true;
                        //ProductService.get(function (data) {
                        //});

                        StockVars.clearCache = true;
                        StockService.get(function (data) {

                        });

                        $rootScope.$broadcast('refreshResumenCaja');
                        MvUtilsGlobals.stopWaiting();
                    });
                    //console.log(data);
                });
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


    }
})();
