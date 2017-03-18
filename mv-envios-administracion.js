(function () {
    'use strict';

    angular.module('mvEncomiendasAdministracion', [])
        .component('mvEncomiendasAdministracion', mvEncomiendasAdministracion());

    function mvEncomiendasAdministracion() {
        return {
            bindings: {
                searchFunction: '&'
            },
            templateUrl: window.installPath + '/mv-angular-cajas/mv-encomiendas-administracion.html',
            controller: MvEncomiendasController
        }
    }

    MvEncomiendasController.$inject = ["EncomiendasVars", 'EncomiendasService', "MvUtils", "UserService", "$scope"];
    /**
     * @param AcEncomiendas
     * @constructor
     */
    function MvEncomiendasController(EncomiendasVars, EncomiendasService, MvUtils, UserService, $scope) {
        var vm = this;
        vm.encomiendas = [];
        vm.paginas = 1;
        vm.soloPendientes = false;
        vm.indice = -1;

        vm.save = save;
        vm.get = get;
        vm.confirmar = confirmar;
        vm.eliminar = eliminar;
        vm.select = select;

        get();

        function select(encomienda, indice) {
            vm.encomienda = angular.copy(encomienda);
            vm.indice = indice;
        }

        function confirmar() {
            vm.encomiendas[vm.indice].nro_guia = vm.encomienda.nro_guia;
            vm.encomiendas[vm.indice].empresa = vm.encomienda.empresa;
            vm.encomiendas[vm.indice].fecha_entrega = vm.encomienda.fecha_entrega;
            vm.encomienda = vm.encomiendas[vm.indice];
            vm.encomienda.status = 1;
            save();
        }

        function eliminar() {
            vm.encomienda.status = 3;
            save();
        }


        function save() {

            EncomiendasService.save(vm.encomienda).then(function (data) {
                return EncomiendasService.get((vm.soloPendientes == true ? undefined : false));
            }).then(function (data) {
                vm.encomiendas = data;
                vm.paginas = EncomiendasVars.paginas;
            });

        }

        function get() {

            EncomiendasService.get((vm.soloPendientes == true ? undefined : false)).then(function (data) {
                vm.encomiendas = data;
                vm.paginas = EncomiendasVars.paginas;
            });
        }


        // Implementación de la paginación
        vm.start = 0;
        vm.limit = EncomiendasVars.paginacion;
        vm.pagina = EncomiendasVars.pagina;
        vm.paginas = EncomiendasVars.paginas;

        function paginar(vars) {
            if (vars == {}) {
                return;
            }
            vm.start = vars.start;
            vm.pagina = vars.pagina;
        }

        vm.next = function () {
            paginar(MvUtils.next(EncomiendasVars));
        };
        vm.prev = function () {
            paginar(MvUtils.prev(EncomiendasVars));
        };
        vm.first = function () {
            paginar(MvUtils.first(EncomiendasVars));
        };
        vm.last = function () {
            paginar(MvUtils.last(EncomiendasVars));
        };

        vm.goToPagina = function () {
            paginar(MvUtils.goToPagina(vm.pagina, EncomiendasVars));
        }

    }


})();
