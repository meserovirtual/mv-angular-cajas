(function () {
    'use strict';

    angular.module('acEncomiendas', ['ngRoute'])

        .component('acEncomiendas', acEncomiendas())
        .factory('EncomiendasService', EncomiendasService)
        .service('EncomiendasVars', EncomiendasVars);

    function acEncomiendas() {
        return {
            bindings: {
                func: '&',
                fncDetalles: '&',
                producto: '=',
                cliente: '<',
                formaPago: '<',
                detalles: '=',
                descuento: '<',
                show: '='
            },
            templateUrl: window.installPath + '/mv-angular-cajas/ac-encomiendas.html',
            controller: AcEncomiendasController
        }
    }


    AcEncomiendasController.$inject = ['$timeout', 'EncomiendasService', 'UserService', 'AcUtilsGlobals'];
    function AcEncomiendasController($timeout, EncomiendasService, UserService, AcUtilsGlobals) {

        var vm = this;

        vm.encomienda = {precio: 0.0};
        vm.costo_envio = {
            iva: "0.00",
            kits: [],
            nombre: "Gastos de envío",
            precios: [],
            producto_id: 99999,
            producto_tipo: 3,
            sku: "999999999999",
            stocks: []
        };


        vm.encomienda.provincia_id = "1";
        vm.encomienda.fecha_entrega = new Date();
        vm.encomienda.fecha_entrega.setDate(vm.encomienda.fecha_entrega.getDate() + 4);

        vm.save = save;


        function save() {

            AcUtilsGlobals.startWaiting();
            vm.producto = vm.costo_envio;
            vm.producto.precios[0] = {precio: vm.encomienda.precio};
            vm.encomienda.usuario_id = UserService.getFromToken().data.id;
            vm.encomienda.cliente_id = vm.cliente;
            vm.encomienda.forma_pago = vm.formaPago;
            $timeout(function () {
                vm.fncDetalles();
                vm.encomienda.detalles = vm.detalles;
                vm.encomienda.total = 0;
                vm.encomienda.descuento = vm.descuento;
                for (var i in vm.encomienda.detalles) {
                    vm.encomienda.total = vm.encomienda.total + vm.encomienda.detalles[i].precio_total;
                }
                //vm.encomienda.total = vm.encomienda.total - vm.descuento;
                EncomiendasService.save(vm.encomienda).then(function (data) {
                    vm.show = false;
                    vm.func();

                });
            }, 0);

        }

    }

    EncomiendasService.$inject = ['$http', 'ProductVars', '$q', 'AcUtilsGlobals', 'ErrorHandler', 'EncomiendasVars'];
    function EncomiendasService($http, ProductVars, $q, AcUtilsGlobals, ErrorHandler, EncomiendasVars) {
        var url = window.installPath + '/ac-angular-cajas/includes/ac-cajas.php';
        var service = {};
        service.get = get;
        service.save = save;

        return service;

        function get(all) {
            AcUtilsGlobals.startWaiting();
            var urlGet = url + '?function=getEncomiendas&all=' + (all == undefined);

            return $http.get(urlGet, {cache: false})
                .then(function (response) {

                        var formas_pago =
                        {
                            "01": "Efectivo",
                            "02": "Débito",
                            "03": "Crédito",
                            "04": "Transferencia CA",
                            "05": "Transferencia CC",
                            "08": "Mercado Pago",
                            "09": "Mercado Libre Efectivo",
                            "10": "Mercado Libre Transferencia"
                        };

                        var fecha_entrega = '';
                        for (var i in response.data) {
                            response.data[i].provincia_id = '' + response.data[i].provincia_id;
                            fecha_entrega = response.data[i].fecha_entrega.substr(0, 4) + '/' + response.data[i].fecha_entrega.substr(5, 2) + '/' + response.data[i].fecha_entrega.substr(8, 2);
                            response.data[i].fecha_entrega = new Date(fecha_entrega);
                            response.data[i].forma_pago_descr = formas_pago[response.data[i].forma_pago];
                        }


                        EncomiendasVars.clearCache = false;
                        EncomiendasVars.paginas = (response.data.length % EncomiendasVars.paginacion == 0) ? parseInt(response.data.length / EncomiendasVars.paginacion) : parseInt(response.data.length / EncomiendasVars.paginacion) + 1;
                        AcUtilsGlobals.stopWaiting();
                        return response.data;
                    }
                )
                .catch(function (response) {
                    EncomiendasVars.clearCache = true;
                    AcUtilsGlobals.stopWaiting();
                    ErrorHandler(response);
                })
        }

        function save(encomienda) {
            var deferred = $q.defer();

            encomienda.fecha_entrega = new Date((encomienda.fecha_entrega.getMonth() + 1) + '/' + (encomienda.fecha_entrega.getDate() + 1) + '/' + encomienda.fecha_entrega.getFullYear());

            if (encomienda.encomienda_id != undefined && encomienda.encomienda_id > 0) {
                deferred.resolve(update(encomienda));
            } else {
                deferred.resolve(create(encomienda));
            }
            return deferred.promise;
        }

        function create(encomienda) {
            return $http.post(url,
                {
                    'function': 'createEncomienda',
                    'encomienda': JSON.stringify(encomienda)
                })
                .then(function (response) {
                    ProductVars.clearCache = true;
                    return response.data;
                })
                .catch(function (response) {
                    ProductVars.clearCache = true;
                    ErrorHandler(response.data)
                });
        }

        function update(encomienda) {
            return $http.post(url,
                {
                    'function': 'updateEncomienda',
                    'encomienda': JSON.stringify(encomienda)
                })
                .then(function (response) {
                    ProductVars.clearCache = true;
                    return response.data;
                })
                .catch(function (response) {
                    ProductVars.clearCache = true;
                    ErrorHandler(response.data)
                });

        }
    }

    EncomiendasVars.$inject = [];
    /**
     * @description Almacena variables temporales de productos
     * @constructor
     */
    function EncomiendasVars() {
        // Cantidad de p�ginas total del recordset
        this.paginas = 1;
        // P�gina seleccionada
        this.pagina = 1;
        // Cantidad de registros por p�gina
        this.paginacion = 10;
        // Registro inicial, no es p�gina, es el registro
        this.start = 0;


        // Indica si se debe limpiar el cach� la pr�xima vez que se solicite un get
        this.clearCache = true;

    }

})();
