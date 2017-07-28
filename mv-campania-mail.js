(function () {
    'use strict';

    angular.module('mvCampaniaMail', ['ngRoute'])
        .component('mvCampaniaMail', mvCampaniaMail());

    function mvCampaniaMail() {
        return {
            bindings: {},
            templateUrl: window.installPath + '/mv-angular-cajas/mv-campania-mail.html',
            controller: MvCampaniaMailController
        }
    }


    MvCampaniaMailController.$inject = ['$scope', 'MvUtils', 'UserService', 'UserVars', 'ContactsService', 'ProductService'];
    function MvCampaniaMailController($scope, MvUtils, UserService, UserVars, ContactsService, ProductService) {

        var vm = this;
        vm.campania = {};
        vm.usuarios = [];
        vm.usuario = {};
        vm.producto = {};
        vm.productos = [];
        var clienteMails = [];


        //FUNCIONES
        vm.loadUsuarios = loadUsuarios;
        vm.addProducto = addProducto;
        vm.sendMail = sendMail;
        vm.removeProducto = removeProducto;


        document.getElementById('searchProducto').getElementsByTagName('input')[0].addEventListener('keyup', function (event) {
            console.log('busco');
            if (event.keyCode == 13) {
                var el = document.getElementById('cantidad');
                if (el != null) {
                    el.focus();
                }
            }
        });

        // Funciones para Autocomplete
        vm.searchProducto = searchProducto;

        function searchProducto(callback) {
            ProductService.get().then(callback).then(function (data) {
                console.log(data);
            }).catch(function (data) {
                console.log(data);
            });
        }

        loadUsuarios();

        function loadUsuarios() {
            UserVars.clearCache = true;
            UserVars.all = true;
            UserService.get(3).then(function (data) {
                vm.usuarios = data;
                console.log(data);
                for(var i=0; i <= data.length - 1; i++) {
                    var mailAdmin = {mail: data[i].mail};
                    clienteMails.push(mailAdmin);
                }
                console.log(clienteMails);
            }).catch(function(error){
                console.log(error);
            });
        }


        function addProducto() {
            if(vm.producto.producto_id == undefined) {
                MvUtils.showMessage('warning', 'Debe elegir un producto');
                return;
            }

            var encontrado = false;
            for(var i=0; i <= vm.productos.length - 1; i++) {
                if(vm.productos[i].producto_id == vm.producto.producto_id) {
                    encontrado = true;
                }
            }

            if(encontrado) {
                MvUtils.showMessage('warning', 'El producto ya esta agregado al listado');
                return;
            } else {
                vm.productos.push(vm.producto);
                vm.producto = {};
                var el = document.getElementById('searchProducto').getElementsByTagName('input');
                if (el[0] != null) {
                    el[0].focus();
                    el[0].value = '';
                }
                var elem = angular.element(document.querySelector('#txtSearchId'));
                vm.searchProductText = '';
                elem.value = '';
            }
        }

        function removeProducto(index) {
            var result = confirm('Realmente desea eliminar el producto de la campaña?');
            if (result) {
                vm.productos.splice(index, 1);
            }
        }

        function sendMail() {
            if(vm.campania.titulo == undefined || vm.campania.titulo == "") {
                MvUtils.showMessage('warning', 'Debe ingresar un Titulo');
                return;
            }
            if(vm.campania.mensaje1 == undefined || vm.campania.mensaje1 == "") {
                MvUtils.showMessage('warning', 'Debe ingresar un Mensaje 1');
                return;
            }
            if(vm.campania.mensaje2 == undefined || vm.campania.mensaje2 == "") {
                MvUtils.showMessage('warning', 'Debe ingresar un Mensaje 2');
                return;
            }
            if(vm.productos.length < 4 || vm.productos.length > 8 ) {
                MvUtils.showMessage('warning', 'Debe ingresar un minimo de 4 productos y un maximo de 8');
                return;
            }

            var mensaje = '';

            mensaje = mensaje + '<!DOCTYPE html>';
            mensaje = mensaje + '<html lang="en">';
            mensaje = mensaje + '<head>';
            mensaje = mensaje + '<meta charset="UTF-8">';
            mensaje = mensaje + '<title></title>';
            mensaje = mensaje + '<style type="text/css">';
            mensaje = mensaje + 'p{margin: 0}';
            mensaje = mensaje + '.spacer {border-bottom: 1px solid;margin: 0 20px;}';
            mensaje = mensaje + '.productoContainer { border: 1px solid #000;width: 22%;}';
            mensaje = mensaje + '.productoImagen {font-size: 12px;padding: 8px;text-align:center;background-color: #546e7a;color: #fff;}';
            mensaje = mensaje + '.productoTitulo {font-size: 14px;padding: 8px;text-align:center;background-color: #546e7a;color: #0d133d;font-weight: bolder;}';
            mensaje = mensaje + '.productoPrecio {font-size: 14px;padding: 8px;text-align:center;background-color: #546e7a;color: #fff;font-weight: bolder;}';
            mensaje = mensaje + '.container2 {padding: 0 20px;display: -webkit-box;display: -moz-box;display: -ms-flexbox;display: -webkit-flex;display: flex;-webkit-flex-direction: row;-ms-flex-direction: row;flex-direction: row;-webkit-box-pack: justify;-moz-box-pack: justify;-webkit-justify-content: space-between;-ms-flex-pack: justify;justify-content: space-between;}';
            mensaje = mensaje + '.col-info-1{width: 70%}';
            mensaje = mensaje + '.col-info-2{width: 30%;}';
            mensaje = mensaje + '.boton{text-decoration: none;background: #546E7A;color: #FFFFFF;padding: 10px 15px;display: flex;float: right;margin-top: calc(75px - 55px);}';
            mensaje = mensaje + '@media only screen and (max-width: 600px) {';
            mensaje = mensaje + '.container2{display: flex;flex-direction: column;justify-content: space-between;}';
            mensaje = mensaje + '.productoContainer {width: 100%}';
            mensaje = mensaje + '}';
            mensaje = mensaje + '</style>';
            mensaje = mensaje + '</head>';
            mensaje = mensaje + '<body style="margin: 20px 5%;background-color: #dce7f0;padding: 20px 0;">';
            mensaje = mensaje + '<div style="width:95%;background-color:#FFFFFF;font-family:Arial;border-radius: 10px;margin: 0 auto;">';
            mensaje = mensaje + '<div style="padding: 10px 20px;display: flex;">';
            mensaje = mensaje + '<div style="width: 70%;">';
            mensaje = mensaje + '<img src="http://mateomaneff.com.ar/images/logo.png" height="70">';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '<div style="width: 30%;">';
            mensaje = mensaje + '<a href="http://meserovirtual.com.ar" title="Haz tu pedido" class="boton">Haz tu pedido</a>';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '<div style="padding: 10px 20px;font-family: arial;font-size: 12px;color: #0d133d;line-height: 18px;">';
            mensaje = mensaje + '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean venenatis <span style="color:#546E7A;">sollicitudin</span> leo, sed pretium leo</p>';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '<div class="spacer"></div>';
            mensaje = mensaje + '<div style="padding: 20px 20px; display: flex;">';
            mensaje = mensaje + '<img src="http://mateomaneff.com.ar/images/lista.jpg" height="200">';
            mensaje = mensaje + '<div style="display: flex;flex-direction: column;margin-left: 10%">';
            mensaje = mensaje + '<h3 style="font-family: arial;font-size: 48px;color: #0d133d;line-height: 48px;">Mesero Virtual</h3>';
            mensaje = mensaje + '<p>' + vm.campania.mensaje1 + '</p>';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '<div class="container2">';
            for(var i=0; i <= 3; i++) {
                mensaje = mensaje + '<div class="productoContainer">';
                mensaje = mensaje + '<div class="productoImagen">';
                mensaje = mensaje + '<img src="http://mateomaneff.com.ar/images/' + vm.productos[i].fotos[0].nombre + '" height="90" width="90">';
                mensaje = mensaje + '</div>';
                mensaje = mensaje + '<div class="productoTitulo">';
                mensaje = mensaje + '<p>' + vm.productos[i].nombre + '</p>';
                mensaje = mensaje + '</div>';
                mensaje = mensaje + '<div class="productoPrecio">';
                mensaje = mensaje + '<p>' + vm.productos[i].precios[0].precio + '</p>';
                mensaje = mensaje + '</div>';
                mensaje = mensaje + '</div>';
            }
            mensaje = mensaje + '</div>';
            if(vm.productos.length > 4) {
                mensaje = mensaje + '<div class="container2" style="margin-top: 10px;">';
                for(var i=4; i <= vm.productos.length - 1; i++) {
                    mensaje = mensaje + '<div class="productoContainer">';
                    mensaje = mensaje + '<div class="productoImagen">';
                    mensaje = mensaje + '<img src="http://mateomaneff.com.ar/images/' + vm.productos[i].fotos[0].nombre + '" height="90" width="90">';
                    mensaje = mensaje + '</div>';
                    mensaje = mensaje + '<div class="productoTitulo">';
                    mensaje = mensaje + '<p>' + vm.productos[i].nombre + '</p>';
                    mensaje = mensaje + '</div>';
                    mensaje = mensaje + '<div class="productoPrecio">';
                    mensaje = mensaje + '<p>' + vm.productos[i].precios[0].precio + '</p>';
                    mensaje = mensaje + '</div>';
                    mensaje = mensaje + '</div>';
                }
                mensaje = mensaje + '</div>';
            }
            mensaje = mensaje + '<div style="padding: 20px 20px 0; display: flex;">';
            mensaje = mensaje + '<div class="col-info-1">';
            mensaje = mensaje + '<h3 style="font-size: 30px;line-height: 35px;font-family: arial;color: #0d133d;margin: 0">Nuestras ofertas de la semana</h3>';
            mensaje = mensaje + '<p style="margin: 0;font-family: arial;font-size: 15px;color: #0d133d;line-height: 20px;">';
            mensaje = mensaje + vm.campania.mensaje2 + '</p>';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '<div class="col-info-2">';
            mensaje = mensaje + '<a href="http://meserovirtual.com.ar" title="Haz tu pedido" class="boton">Haz tu pedido</a>';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '<div class="spacer" style="margin-top: 1em"></div>';
            mensaje = mensaje + '<div style="padding: 30px 20px 60px;display: flex;">';
            mensaje = mensaje + '<div style="text-align: center;width: 50%;">';
            mensaje = mensaje + '<b>Danos tu opinion</b><br><br>';
            mensaje = mensaje + '<a href="http://meserovirtual.com.ar" title="Haz tu pedido" style="color: #0d133d;text-decoration: none;">Opina</a>';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '<div style="border-right: 1px solid;">';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '<div style="text-align: center;width: 50%;">';
            mensaje = mensaje + '<b>Siguenos por:</b><br><br>';
            mensaje = mensaje + '<img src="http://mateomaneff.com.ar/images/social_face.jpg" width="24" height="22">';
            mensaje = mensaje + '<img src="http://mateomaneff.com.ar/images/social_twitter.jpg" width="25" height="22">';
            mensaje = mensaje + '<img src="http://mateomaneff.com.ar/images/social_in.jpg" width="25" height="22">';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '<div style="padding: 0 20px;font-family:Arial;font-size: 10px;color: #0d133d;line-height: 20px;text-align: center">';
            mensaje = mensaje + '<p>Todos los derechos reservados - La casa se reserva el derecho de admisión. Promoción valida solo para el 2017</p>';
            mensaje = mensaje + '</div>';
            mensaje = mensaje + '</body>';
            mensaje = mensaje + '</html>';

            console.log('Se armo el mail');

            ContactsService.sendMail(window.mailAdmin, window.mailAdmins, 'Mesero Virtual', vm.campania.titulo, mensaje)
                .then(function (data) {
                    console.log(data);
                    vm.campania = {};
                    vm.producto = {};
                    vm.productos = [];
                    MvUtils.showMessage('success', 'El mail fue enviado exitosamente');
                }).catch(function(data){
                    console.log(data);
                    MvUtils.showMessage('error', 'Se produjo un error al enviar el mail');
                });
        }

    }

})();
