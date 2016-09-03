(function () {
    'use strict';

    angular.module('acEncomiendasAdministracion', [])
        .component('acEncomiendasAdministracion', acEncomiendasAdministracion());

    function acEncomiendasAdministracion() {
        return {
            bindings: {
                searchFunction: '&'
            },
            templateUrl: window.installPath + '/ac-angular-cajas/ac-encomiendas-administracion.html',
            controller: AcEncomiendasController
        }
    }

    AcEncomiendasController.$inject = ["EncomiendasVars", 'EncomiendasService', "AcUtils", "UserService", "$scope"];
    /**
     * @param AcEncomiendas
     * @constructor
     */
    function AcEncomiendasController(EncomiendasVars, EncomiendasService, AcUtils, UserService, $scope) {
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
            paginar(AcUtils.next(EncomiendasVars));
        };
        vm.prev = function () {
            paginar(AcUtils.prev(EncomiendasVars));
        };
        vm.first = function () {
            paginar(AcUtils.first(EncomiendasVars));
        };
        vm.last = function () {
            paginar(AcUtils.last(EncomiendasVars));
        };

        vm.goToPagina = function () {
            paginar(AcUtils.goToPagina(vm.pagina, EncomiendasVars));
        }

    }


})();
