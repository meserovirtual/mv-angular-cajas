(function () {
    'use strict';

    angular.module('mvFactura', ['ngRoute'])

        .component('mvFactura', mvFactura())
        .factory('FacturaService', FacturaService);

    function mvFactura() {
        return {
            bindings: {},
            templateUrl: window.installPath + '/mv-angular-cajas/mv-factura.html',
            controller: MvFacturaController
        }
    }


    MvFacturaController.$inject = ['$timeout', 'FacturaService'];

    function MvFacturaController($timeout, FacturaService) {
        console.log(FacturaService.factura);

        var vm = this;
        vm.data = FacturaService.factura;
        vm.numero = '';

        var lenNro = ('' + (vm.data.response.Nro)).length;
        for (var i = 0; i < 8 - lenNro; i++) {
            vm.numero = vm.numero + '0';
        }

        console.log(vm.numero);

        vm.numero = vm.numero + vm.data.response.Nro;


        vm.print = function (printSectionId) {
            var innerContents = document.getElementById('factura-main').innerHTML;
            var popupWinindow = window.open('', '_blank', 'width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
            popupWinindow.document.open();
            popupWinindow.document.write('<html><head><link rel="stylesheet" type="text/css" href="stylesheets/styles.css" /></head><body onload="window.print()">' + innerContents + '</html>');
            popupWinindow.document.close();

        };

    }

    FacturaService.$inject = ['$http', 'ProductVars', '$q', 'MvUtilsGlobals', 'ErrorHandler'];

    function FacturaService($http, ProductVars, $q, MvUtilsGlobals, ErrorHandler) {

        var url = window.installPath + '/mv-angular-cajas/includes/mv-cajas.php';

        var service = {};
        service.set = set;
        service.factura = {};
        return service;

        function set(data) {
            service.factura = data;
        }
    }


})();
