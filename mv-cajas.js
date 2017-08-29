(function () {
    'use strict';
    var scripts = document.getElementsByTagName("script");
    var currentScriptPath = scripts[scripts.length - 1].src;

    if (currentScriptPath.length == 0) {
        currentScriptPath = window.installPath + '/mv-angular-cajas/includes/mv-cajas.php';
    }

    angular.module('mvCajas', [])

        //.controller('CajasController', CajasController)

        .factory('CajasService', CajasService)
        .service('CajasVars', CajasVars)
    ;

    CajasService.$inject = ['$http', '$cacheFactory', 'CajasVars', 'ErrorHandler', '$q'];
    function CajasService($http, $cacheFactory, CajasVars, ErrorHandler, $q) {
        var service = {};
        var url = currentScriptPath.replace('mv-cajas.js', '/includes/mv-cajas.php');
        // Cajas diarias siempre por sucursal
        service.getCajaDiaria = getCajaDiaria;
        service.getHistoricoCajaDiaria = getHistoricoCajaDiaria;
        service.getSaldoInicial = getSaldoInicial;
        service.getCajas = getCajas;
        service.getCajaDiariaFromTo = getCajaDiariaFromTo;
        service.getCajasBySucursal = getCajasBySucursal;
        service.getMovimientos = getMovimientos;
        service.totalConcepto = totalConcepto;
        service.checkEstado = checkEstado;
        service.getSaldoFinal = getSaldoFinal;
        service.getSaldoFinalAnterior = getSaldoFinalAnterior;
        service.cerrarCaja = cerrarCaja;
        service.abrirCaja = abrirCaja;
        service.getAsientoCajaById = getAsientoCajaById;
        service.getTotalByCuenta = getTotalByCuenta;
        service.getDetalleByCuenta = getDetalleByCuenta;
        service.getResultado = getResultado;
        service.crearFactura = crearFactura;

        return service;

        function getTotalByCuenta(cuenta, sucursal_id) {
            var urlGet = url + '?function=getTotalByCuenta&cuenta_id=' + cuenta + '&sucursal_id=' + sucursal_id;
            var $httpDefaultCache = $cacheFactory.get('$http');
            var cachedData = [];

            // Verifica si existe el cache de productos
            if ($httpDefaultCache.get(urlGet) != undefined) {
                if (CajasVars.clearCache) {
                    $httpDefaultCache.remove(urlGet);
                }
                else {
                    var deferred = $q.defer();
                    cachedData = $httpDefaultCache.get(urlGet);
                    deferred.resolve(cachedData);
                    return deferred.promise;
                }
            }

            return $http.get(urlGet, {cache: true})
                .then(function (response) {
                    $httpDefaultCache.put(urlGet, response.data);
                    CajasVars.getTotalByCuenta.clearCache = false;
                    return response.data;
                })
                .catch(function (response) {
                    CajasVars.getTotalByCuenta.clearCache = false;
                    ErrorHandler(response);
                })
        }

        function getDetalleByCuenta(cuenta) {

        }


        function totalConcepto(where, fecha_desde, fecha_hasta, callback) {
            return $http.get(url + '?function=totalConcepto&where=' + where + '&fecha_desde=' + fecha_desde + '&fecha_hasta=' + fecha_hasta)
                .success(function (data) {
                    callback(data)
                })
                .error(function (data) {
                    callback(data)
                });
        }


        function getMovimientos(fecha_desde, fecha_hasta, callback) {
            return $http.get(url + '?function=getMovimientos&fecha_desde=' + fecha_desde + '&fecha_hasta=' + fecha_hasta)
                .success(function (data) {
                    callback(data)
                })
                .error(function (data) {
                    callback(data)
                });
        }

        function getCajaDiariaFromTo(sucursal_id, pos_id, asiento_id_inicio, asiento_id_fin) {
            return $http.post(url, {
                function: 'getCajaDiariaFromTo',
                sucursal_id: sucursal_id,
                pos_id: pos_id,
                asiento_id_inicio: asiento_id_inicio,
                asiento_id_fin: asiento_id_fin
            })
                .then(function (data) {
                    return data;
                })
                .catch(function (data) {
                    ErrorHandler(data);
                });
        }


        function getCajas() {
            return $http.get(url + '?function=getCajas', {cache: true})
                .then(function (data) {
                    return data;
                })
                .catch(function (data) {
                    ErrorHandler(data);
                });
        }

        /*
         function getCajasBySucursal(sucursal_id, pos_id, callback) {
         getCajas(function (data) {
         var response = data.filter(function (elem, index, array) {
         return elem.sucursal_id == sucursal_id && elem.pos_id == pos_id;
         });

         callback(response);
         });

         }
         */
        function getCajasBySucursal(sucursal_id, pos_id) {
            return getCajas().then(function (data) {
                var response = data.data.filter(function (elem, index, array) {
                    return elem.sucursal_id == sucursal_id && elem.pos_id == pos_id;
                });
                return response;
            }).catch(function(data){
                ErrorHandler(data);
            });

        }

        function getCajaDiaria(sucursal_id, pos_id, callback) {
            return $http.get(url + '?function=getCajaDiaria&sucursal_id=' + sucursal_id + '&pos_id=' + pos_id)
                .success(function (data) {
                    callback(data)
                })
                .error(function (data) {
                    callback(data)
                });

        }

        function getAsientoCajaById(asiento_id, sucursal_id, pos_id, callback) {
            getCajaDiaria(sucursal_id, pos_id, function (data) {
                var response = data.filter(function (elem, index, array) {
                    return elem.asiento_id == asiento_id;
                });
                callback(response);
            });
        }

        function getHistoricoCajaDiaria(sucursal_id, pos_id, callback) {
            //return $http.post();

        }

        function getSaldoFinal(sucursal_id, pos_id) {
            return $http.post(url,
                {
                    function: 'getSaldoFinal',
                    sucursal_id: sucursal_id,
                    pos_id: pos_id
                })
                .then(function (data) {
                    return data;
                })
                .catch(function (data) {
                    ErrorHandler(data);
                });
        }

        function cerrarCaja(sucursal_id, pos_id, importe, detalles) {
            return $http.post(url, {
                function: 'cerrarCaja',
                sucursal_id: sucursal_id,
                pos_id: pos_id,
                importe: importe,
                detalles: detalles
            })
                .then(function (data) {
                    return data;
                })
                .catch(function (data) {
                    ErrorHandler(data);
                });

        }

        function abrirCaja(sucursal_id, pos_id, importe) {
            return $http.post(url, {function: 'abrirCaja', sucursal_id: sucursal_id, pos_id: pos_id, importe: importe})
                .then(function (data) {
                    return data;
                })
                .catch(function (data) {
                    ErrorHandler(data);
                });

        }

        function getSaldoInicial(sucursal_id, pos_id) {
            return $http.get(url + '?function=getSaldoInicial&sucursal_id=' + sucursal_id + '&pos_id=' + pos_id)
                .then(function (data) {
                    return data
                })
                .catch(function (data) {
                    ErrorHandler(data);
                });
        }

        function getSaldoFinalAnterior(sucursal_id, pos_id) {
            return $http.get(url + '?function=getSaldoFinalAnterior&sucursal_id=' + sucursal_id + '&pos_id=' + pos_id)
                .then(function (data) {
                    return data;
                })
                .catch(function (data) {
                    ErrorHandler(data);
                });
        }

        function checkEstado(sucursal_id, pos_id) {
            return $http.get(url + '?function=checkEstado&sucursal_id=' + sucursal_id + '&pos_id=' + pos_id)
                .then(function (data) {
                    return data;
                })
                .catch(function (data) {
                    ErrorHandler(data);
                });
        }

        function getResultado(cuenta_id) {
            return $http.get(url + '?function=getResultado&cuenta_id=' + cuenta_id)
                .then(function (data) {
                    return data;
                })
                .catch(function (data) {
                    ErrorHandler(data);
                });
        }

        function crearFactura(cbteTipo, docTipo, docNro, impNeto, impTotal) {
            /*
             CbteTipo
             1 Factura A
             6 Factura B

             DocTipo
             80	CUIT
             86	CUIL
             87	CDI

             DocNro
             ImpNeto
             ImpTotal
             */

            if(docTipo === 0){
                docTipo = 87
            }else if(docTipo === 1){
                docTipo = 80
            }else if(docTipo === 2){
                docTipo = 86
            }

            return $http.post('bower_components/mv-angular-cajas/includes/afip/index.php', {
                CbteTipo: cbteTipo,
                DocTipo: docTipo,
                DocNro: docNro,
                ImpNeto: impNeto,
                ImpTotal: impTotal
            })
                .then(function (data) {
                    console.log(data);
                    return data;
                })
                .catch(function (data) {
                    console.log(data);
                    ErrorHandler(data);
                });
        }

    }


    CajasVars.$inject = [];
    function CajasVars() {

        // Solo para la funcionalidad de getTotalByCuenta, limpio o no el caché
        this.getTotalByCuenta = {};
        this.getTotalByCuenta.clearCache = true;
    }
})();