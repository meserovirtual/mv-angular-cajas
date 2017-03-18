(function () {
    'use strict';

    angular.module('mvEnvios', ['ngRoute'])

        .component('mvEnvios', mvEnvios())
        .factory('EnviosService', EnviosService)
        .service('EnviosVars', EnviosVars);

    function mvEnvios() {
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
            templateUrl: window.installPath + '/mv-angular-cajas/mv-envios.html',
            controller: MvEnviosController
        }
    }


    MvEnviosController.$inject = ['$timeout', 'EnviosService', 'UserService', 'MvUtilsGlobals'];
    function MvEnviosController($timeout, EnviosService, UserService, MvUtilsGlobals) {

        var vm = this;

        vm.envio = {precio: 0.0};
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


        vm.envio.provincia_id = "1";
        vm.envio.fecha_entrega = new Date();
        vm.envio.fecha_entrega.setDate(vm.envio.fecha_entrega.getDate() + 4);

        vm.save = save;


        function save() {

            MvUtilsGlobals.startWaiting();
            vm.producto = vm.costo_envio;
            vm.producto.precios[0] = {precio: vm.envio.precio};
            vm.envio.usuario_id = UserService.getFromToken().data.id;
            vm.envio.cliente_id = vm.cliente;
            vm.envio.forma_pago = vm.formaPago;

            $timeout(function () {
                vm.fncDetalles();
                vm.envio.detalles = vm.detalles;
                vm.envio.total = 0;
                vm.envio.descuento = vm.descuento;

                for (var i in vm.envio.detalles) {
                    vm.envio.total = vm.envio.total + vm.envio.detalles[i].precio_total;
                }
                //vm.envio.total = vm.envio.total - vm.descuento;
                EnviosService.save(vm.envio).then(function (data) {
                    vm.show = false;
                    vm.func();
                });
            }, 0);

        }

    }

    EnviosService.$inject = ['$http', 'ProductVars', '$q', 'MvUtilsGlobals', 'ErrorHandler', 'EnviosVars'];
    function EnviosService($http, ProductVars, $q, MvUtilsGlobals, ErrorHandler, EnviosVars) {

        var url = window.installPath + '/mv-angular-cajas/includes/mv-cajas.php';
        var service = {};
        service.get = get;
        service.save = save;

        return service;

        function get(all) {
            MvUtilsGlobals.startWaiting();
            var urlGet = url + '?function=getEnvios&all=' + (all == undefined);

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


                    EnviosVars.clearCache = false;
                    EnviosVars.paginas = (response.data.length % EnviosVars.paginacion == 0) ? parseInt(response.data.length / EnviosVars.paginacion) : parseInt(response.data.length / EnviosVars.paginacion) + 1;
                    MvUtilsGlobals.stopWaiting();
                    return response.data;
                }
            )
                .catch(function (response) {
                    EnviosVars.clearCache = true;
                    MvUtilsGlobals.stopWaiting();
                    ErrorHandler(response);
                })
        }

        function save(envio) {
            var deferred = $q.defer();

            envio.fecha_entrega = new Date((envio.fecha_entrega.getMonth() + 1) + '/' + (envio.fecha_entrega.getDate() + 1) + '/' + envio.fecha_entrega.getFullYear());

            if (envio.envio_id != undefined && envio.envio_id > 0) {
                deferred.resolve(update(envio));
            } else {
                deferred.resolve(create(envio));
            }
            return deferred.promise;
        }

        function create(envio) {
            return $http.post(url,
                {
                    'function': 'createEnvio',
                    'envio': JSON.stringify(envio)
                })
                .then(function (response) {
                    EnviosVars.clearCache = true;
                    return response.data;
                })
                .catch(function (response) {
                    EnviosVars.clearCache = true;
                    ErrorHandler(response.data)
                });
        }

        function update(envio) {
            return $http.post(url,
                {
                    'function': 'updateEnvio',
                    'envio': JSON.stringify(envio)
                })
                .then(function (response) {
                    EnviosVars.clearCache = true;
                    return response.data;
                })
                .catch(function (response) {
                    EnviosVars.clearCache = true;
                    ErrorHandler(response.data)
                });

        }
    }

    EnviosVars.$inject = [];
    /**
     * @description Almacena variables temporales de productos
     * @constructor
     */
    function EnviosVars() {
        // Cantidad de p?ginas total del recordset
        this.paginas = 1;
        // P?gina seleccionada
        this.pagina = 1;
        // Cantidad de registros por p?gina
        this.paginacion = 10;
        // Registro inicial, no es p?gina, es el registro
        this.start = 0;

        // Indica si se debe limpiar el cach? la pr?xima vez que se solicite un get
        this.clearCache = true;

    }

})();
