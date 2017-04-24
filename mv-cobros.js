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


    MvCobrosController.$inject = ['StockService', 'UserService', 'MvUtils', 'MvUtilsGlobals', '$scope', '$rootScope', 'MovimientosService',
        'MovimientoStockFinal', 'StockVars', 'HelperService', 'ComandasService', 'EnviosService', 'MesasService', 'ComandaService'];
    function MvCobrosController(StockService, UserService, MvUtils, MvUtilsGlobals, $scope, $rootScope, MovimientosService,
                                MovimientoStockFinal, StockVars, HelperService, ComandasService, EnviosService, MesasService,
                                ComandaService) {

        var vm = this;
        vm.tipo_precio = '0';
        vm.usuario = {};
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
        vm.paga_con_x = 0;
        vm.paga_con_y = 0;
        vm.descuento = 0;
        vm.origenesCobro = [];
        vm.origenCobro = {};
        vm.formasDePago = [];
        vm.formaDePago1 = {};
        vm.formaDePago2 = {};
        vm.observaciones = '';
        vm.showDelivery = false;
        vm.comanda = {};

        vm.agregarDetalle = agregarDetalle;
        vm.removeDetalle = removeDetalle;
        vm.save = save;
        vm.calc_a_cobrar = calc_a_cobrar;
        vm.encomienda = encomienda;
        vm.calcularTotal = calcularTotal;
        vm.validateMonto = validateMonto;
        vm.aCuenta = aCuenta;
        vm.saveComanda = saveComanda;
        vm.delivery = delivery;
        vm.saveDelivery = saveDelivery;


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
            console.log('busco');
            if (event.keyCode == 13) {
                var el = document.getElementById('cantidad');
                if (el != null) {
                    el.focus();
                }
            }
        });

        vm.formasDePago = [
            {id: '01', tipo:'Efectivo'},
            {id: '02', tipo:'Débito'},
            {id: '03', tipo:'Crédito'},
            {id: '04', tipo:'Transferencia CA'},
            {id: '05', tipo:'Transferencia CC'},
            {id: '08', tipo:'Mercado Pago'}
        ];

        vm.formaDePago1 = vm.formasDePago[0];
        vm.formaDePago2 = vm.formasDePago[1];

        loadOrigenesCobro();

        function loadOrigenesCobro() {
            MesasService.get().then(function(mesas){
                //console.log(mesas);
                vm.origenesCobro = [
                    {origen_id: -1, nombre:'Mostrador'},
                    {origen_id: -2, nombre:'Delivery'},
                ];
                mesas.forEach(function(mesa){
                    vm.origenesCobro.push({origen_id: mesa.mesa_id, nombre: mesa.mesa});
                });
                //console.log(vm.origenesCobro);
                vm.origenCobro = vm.origenesCobro[0];
            }).catch(function(error){
                console.log(error);
            })
        }

        if(ComandaService.comanda != undefined || ComandaService.comanda != {}) {
            //console.log(ComandaService.comanda);
            vm.comanda = ComandaService.comanda;

            getOrigenDeCobro(ComandaService.comanda.origen_id);
            getNumero(ComandaService.comanda);
            getDetalle(ComandaService.comanda);
        }

        function getNumero(comanda) {
            if(comanda.origen_id == -1) {
                vm.numero = comanda.comanda_id;
            } else if(comanda.origen_id == -2) {

            }
        }

        function getOrigenDeCobro(origen_id) {
            vm.origenesCobro = [];

            MesasService.get().then(function(mesas){
                vm.origenesCobro = [
                    {origen_id: -1, nombre:'Mostrador'},
                    {origen_id: -2, nombre:'Delivery'},
                ];
                mesas.forEach(function(mesa){
                    vm.origenesCobro.push({origen_id: mesa.mesa_id, nombre: mesa.mesa});
                });

                for(var i=0; i < vm.origenesCobro.length - 1; i++) {
                    if(vm.origenesCobro[i].origen_id == origen_id) {
                        vm.origenCobro = vm.origenesCobro[i];
                        return;
                    }
                }
            }).catch(function(error){
                console.log(error);
            });

        }

        function getDetalle(comanda) {
            if(comanda.detalles != undefined) {
                var list = Object.getOwnPropertyNames(comanda.detalles);

                list.forEach(function (item, index, array) {
                    vm.detalle = {
                        producto_id: comanda.detalles[item].producto_id,
                        //sku: prod.sku,
                        sku: '',
                        producto_nombre: comanda.detalles[item].nombre,
                        cantidad: comanda.detalles[item].cantidad,
                        //precio_unidad: ((prod.precios[vm.tipo_precio] != undefined) ? prod.precios[vm.tipo_precio].precio : prod.precios[0].precio),
                        precio_unidad: comanda.detalles[item].precio / comanda.detalles[item].cantidad,
                        //precio_total: parseInt(vm.cantidad) * parseFloat(((prod.precios[vm.tipo_precio] != undefined) ? prod.precios[vm.tipo_precio].precio : prod.precios[0].precio)),
                        precio_total: comanda.detalles[item].precio,
                        //stock: prod.stocks,
                        //productos_kit: prod.kits,
                        //productos_tipo: prod.producto_tipo,
                        mp: false,
                        //iva: prod.iva,
                        observaciones: comanda.detalles[item].comentarios,
                    };

                    vm.detalles.push(vm.detalle);
                });
                //console.log(vm.detalles);
            }
        }

        function createComandaDetalle() {
            //TODO: Hacer que genere la comanda
            var detalles = [];

            for(var i = 0; i <= vm.detalles.length - 1; i++) {
                var detalle = {};
                detalle.producto_id = vm.detalles[i].producto_id;
                detalle.status = 0;
                detalle.comentarios = vm.detalles[i].observaciones;
                detalle.cantidad = vm.detalles[i].cantidad;
                detalle.precio = vm.detalles[i].precio_total;
                detalle.kits = [];

                var kit = {};
                kit = {
                    comanda_detalle_id: 0,
                    selected: false,
                    opcional: 1,
                    producto_id: vm.detalles[i].producto_id,
                    cantidad: vm.detalles[i].cantidad,
                    precio: vm.detalles[i].precio_total
                }
                detalle.kits.push(kit);

                detalles.push(detalle);
            }
            console.log(detalles);

            return detalles;
        }

        function createComanda() {
            var comanda = {
                origen_id: vm.origenCobro.origen_id,
                total: vm.a_cobrar,
                status: 0,
                mesa_id: (vm.origenCobro.origen_id > 0) ? vm.origenCobro.origen_id : '-1',
                usuario_id: -2,
                detalles: []
            };
            comanda.detalles = createComandaDetalle();

            console.log(comanda);
            return comanda;
        }


        function saveComanda() {
            if(vm.origenCobro.origen_id == -2) {
                MvUtils.showMessage('warning', 'Esta opción solo es valida para Deliveries');
                return;
            }

            ComandasService.save(createComanda()).then(function(data){
                console.log(data);
                cleanVariables();
            }).catch(function(data){
                console.log(data);
            });

        }

        function cleanVariables() {
            vm.forma_pago = '01';
            vm.desc_porc = 0;
            vm.desc_cant = 0;
            vm.a_cobrar = 0;
            vm.paga_con = 0;
            vm.vuelto = 0;
            vm.total = 0;
            vm.paga_con_x = 0;
            vm.paga_con_y = 0;
            vm.observaciones = '';
            vm.detalles = [];
            vm.detalle = {};
            vm.producto = {};
            vm.formaDePago1 = vm.formasDePago[0];
            vm.formaDePago2 = vm.formasDePago[1];
        }


        function validateMonto() {
            if(vm.paga_con_x < 0){
                MvUtils.showMessage('error', 'El valor ingresado es mayor al monto que se debe cobrar');
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
                MvUtils.showMessage('error', 'Debe seleccionar un producto');
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
                    iva: prod.iva,
                    observaciones: vm.observaciones,
                };

                vm.detalles.push(vm.detalle);
            }

            //console.log(vm.detalles);

            vm.producto = {};
            vm.observaciones = '';
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
                    MvUtils.showMessage('error', 'Solo quedan ' + total_en_suc + ' productos');
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
                    MvUtils.showMessage('error', 'Solo se pueden armar solo ' + cant_actual + ' kits.');
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

            if (vm.formaDePago1.id == '08' || vm.formaDePago1.id == '09' || vm.formaDePago1.id == '10' ||
                vm.formaDePago2.id == '08' || vm.formaDePago2.id == '09' || vm.formaDePago2.id == '10') {

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
                MvUtils.showMessage('error', 'No hay productos seleccionados');
                return;
            }

            MvUtilsGlobals.startWaiting();
            //var usuario_id = -1;
            if (vm.usuario !== undefined && vm.usuario.usuario_id !== undefined) {
                vm.usuario_id = vm.usuario.usuario_id;
            } else {
                if (vm.usuario.nombre !== '') {
                    if (MvUtils.validateEmail(vm.usuario.nombre)) {
                        vm.usuario = {
                            nombre: '',
                            apellido: '',
                            mail: vm.usuario.nombre,
                            nacionalidad_id: '',
                            tipo_doc: 0,
                            nro_doc: '',
                            comentarios: '',
                            marcado: 0,
                            fecha_nacimiento: ''
                        };
                        UserService.create(vm.usuario).then(function (data) {
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
                forma_pagos.push({forma_pago: vm.formaDePago1.id, importe: vm.paga_con_x});
            }
            if(vm.paga_con_y > 0 && vm.paga_con_y !== null){
                forma_pagos.push({forma_pago: vm.formaDePago2.id, importe: vm.paga_con_y});
            }
            console.log(forma_pagos);
            //console.log(vm.detalles);
            //return;
            //(tipo_asiento, subtipo_asiento, sucursal_id, forma_pago, transferencia_desde, total, descuento, detalle, items, usuario_id, usuario_id, comentario, callback)
            //MovimientosService.armarMovimiento('001', '00', UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, vm.forma_pago, '00', vm.total, vm.desc_cant, 'Venta de Caja', vm.detalles, vm.usuario_id, 1, vm.comentario,
            MovimientosService.armarMovimiento('001', '00', UserService.getFromToken().data.sucursal_id, UserService.getFromToken().data.caja_id, forma_pagos, '00', vm.total, vm.desc_cant, 'Venta de Caja', vm.detalles, vm.usuario_id, 1, vm.comentario)
                .then(function (data) {

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
                        MvUtils.showMessage('success', 'Venta realizada con éxito.');
                        vm.usuario = {};

                        vm.comanda.status = 5; //Comanda cerrada
                        ComandasService.updateStatusComanda(vm.comanda).then(function(data){
                            console.log(data);
                            vm.comanda = {};
                            ComandaService.comanda = {};
                        }).catch(function(error){
                            console.log(error);
                        });

                        cleanVariables();

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
                        MvUtilsGlobals.stopWaiting();
                    });
                    //console.log(data);
                }).catch(function(error){
                    console.log(error);
                });
        }

        function encomienda() {
            if (vm.usuario == undefined || vm.usuario.usuario_id == undefined) {
                MvUtils.showMessage('error', 'Debe seleccionar un cliente para poder generar una encomienda');
                return;
            }
            if (vm.detalles.length < 1) {
                MvUtils.showMessage('error', 'No hay productos seleccionados');
                return;
            }
            vm.showEncomienda = true;
        }

        function delivery() {
            vm.showDelivery = true;
        }


        function createEnvio(usuario) {
            var envio = {
                fecha_entrega: new Date(),
                usuario_id: UserService.getFromToken().data.id,
                cliente_id: usuario.usuario_id,
                total: vm.a_cobrar,
                calle: usuario.direcciones[0].calle,
                nro: usuario.direcciones[0].nro,
                cp: '',
                forma_pago: vm.formaDePago1.id,
                status: 0,
                descuento: 0,
                detalles: []
            };
            envio.detalles = createEnvioDetalle();

            console.log(envio);

            return envio;
        }

        function createEnvioDetalle() {
            var detalles = [];

            for(var i = 0; i <= vm.detalles.length - 1; i++) {
                var detalle = {};
                detalle.envio_id = 0;
                detalle.producto_id = vm.detalles[i].producto_id;
                detalle.cantidad = vm.detalles[i].cantidad;
                detalle.precio = vm.detalles[i].precio_total;

                detalles.push(detalle);
            }

            return detalles;
        }

        function saveDelivery() {

            if(vm.origenCobro.origen_id != -2) {
                MvUtils.showMessage('error', 'El origen de ingreso debe ser Delivery');
                return;
            }
            //TODO: guardar los datos del cliente que realiza el pedido del delivery
            if(vm.usuario.apellido == undefined){
                MvUtils.showMessage('error', 'El apellido es obligatorio');
                return;
            }
            if(vm.usuario.nombre == undefined){
                MvUtils.showMessage('error', 'El nombre es obligatorio');
                return;
            }
            if(vm.usuario.telefono == undefined){
                MvUtils.showMessage('error', 'El teléfono es obligatorio');
                return;
            }
            if(vm.usuario.mail == undefined){
                MvUtils.showMessage('error', 'El mail es obligatorio');
                return;
            } else {
                if(!MvUtils.validateEmail(vm.usuario.mail)){
                    MvUtils.showMessage('error', 'El mail ingresado no tiene un formato valido');
                    return;
                }
            }
            if(vm.usuario.direcciones == undefined){
                MvUtils.showMessage('error', 'La dirección es obligatorio');
                return;
            } else {
                if(vm.usuario.direcciones[0].calle == undefined){
                    MvUtils.showMessage('error', 'La dirección es obligatorio');
                    return;
                }
                if(vm.usuario.direcciones[0].nro == undefined){
                    MvUtils.showMessage('error', 'El número es obligatorio');
                    return;
                }
            }

            if (vm.detalles.length < 1) {
                MvUtils.showMessage('error', 'No hay productos agregados');
                return;
            }

            vm.usuario.rol_id = 3;
            vm.usuario.status = 1;
            //Creo el usuario cliente
            UserService.save(vm.usuario).then(function(data){
                vm.usuario.usuario_id = data.usuario_id;
                console.log('Usuario creado');
                //Creo el envio
                EnviosService.save(createEnvio(vm.usuario)).then(function(data){
                    console.log(data);
                    console.log('Envio creado');
                    //Creo la comanda
                    ComandasService.save(createComanda()).then(function(data){
                        console.log(data);
                        console.log('Comanda creada');
                        cleanVariables();
                    }).catch(function(data){
                        console.log(data);
                    });

                }).catch(function(data){
                    console.log(data);
                });

            }).catch(function(data){
                console.log(data);
            });

        }

        // Funciones para Autocomplete
        vm.searchCliente = searchCliente;
        vm.searchProducto = searchProducto;

        function searchProducto(callback) {
            StockService.get().then(callback).then(function (data) {
                console.log(data);
            }).catch(function(data){
                console.log(data);
            });
        }

        function searchCliente(callback) {
            UserService.get(3).then(callback).then(function(data){
                console.log(data);
            }).catch(function(data){
                console.log(data);
            });
        }

        /**
         * Cobro a Cuenta del cliente
         */
        function aCuenta() {
            /*
             if (vm.detalles.length < 1) {
             MvUtils.showMessage('error', 'No hay productos seleccionados');
             return;
             }

             MvUtilsGlobals.startWaiting();
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
             vm.paga_con_x = 0;
             vm.paga_con_y = 0;

             MvUtils.showMessage('success', 'Venta realizada con éxito.');
             //} else {
             //    MvUtils.showMessage('error', 'Error al realizar la venta');
             //}
             }).catch(function(data){
             console.log(data);
             MvUtils.showMessage('error', 'Error al realizar la venta');
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
             MvUtilsGlobals.stopWaiting();

             });
             //console.log(data);
             });
             } else {
             MvUtils.showMessage('error', 'Debe seleccionar un cliente');
             return;
             }
             */
        }


    }

})();
