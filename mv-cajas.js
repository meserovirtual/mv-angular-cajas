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

    CajasService.$inject = ['$http', '$cacheFactory', 'CajasVars'];
    function CajasService($http, $cacheFactory, CajasVars) {
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
        return service;

        function getTotalByCuenta(cuenta, sucursal_id, callback) {
            var urlGet = url + '?function=getTotalByCuenta&cuenta_id=' + cuenta + '&sucursal_id=' + sucursal_id;
            var $httpDefaultCache = $cacheFactory.get('$http');
            var cachedData = [];


            // Verifica si existe el cache de productos
            if ($httpDefaultCache.get(urlGet) != undefined) {
                if (CajasVars.clearCache) {
                    $httpDefaultCache.remove(urlGet);
                }
                else {
                    cachedData = $httpDefaultCache.get(urlGet);
                    callback(cachedData);
                    return;
                }
            }


            return $http.get(urlGet, {cache: true})
                .success(function (data) {
                    $httpDefaultCache.put(urlGet, data);
                    CajasVars.getTotalByCuenta.clearCache = false;
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                    CajasVars.getTotalByCuenta.clearCache = false;
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


        function getCajaDiariaFromTo(sucursal_id, pos_id, asiento_id_inicio, asiento_id_fin, callback) {
            return $http.post(url, {
                    function: 'getCajaDiariaFromTo',
                    sucursal_id: sucursal_id,
                    pos_id: pos_id,
                    asiento_id_inicio: asiento_id_inicio,
                    asiento_id_fin: asiento_id_fin
                })
                .success(function (data) {
                    callback(data)
                })
                .error(function (data) {
                    callback(data)
                });
        }

        function getCajas(callback) {
            return $http.get(url + '?function=getCajas', {cache: true})
                .success(function (data) {
                    callback(data)
                })
                .error(function (data) {
                    callback(data)
                });
        }

        function getCajasBySucursal(sucursal_id, pos_id, callback) {
            getCajas(function (data) {
                var response = data.filter(function (elem, index, array) {
                    return elem.sucursal_id == sucursal_id && elem.pos_id == pos_id;
                });

                callback(response);
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

        function getSaldoFinal(sucursal_id, pos_id, callback) {
            return $http.post(url, {function: 'getSaldoFinal', sucursal_id: sucursal_id, pos_id: pos_id})
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                });

        }

        function cerrarCaja(sucursal_id, pos_id, importe, detalles, callback) {
            return $http.post(url, {
                    function: 'cerrarCaja',
                    sucursal_id: sucursal_id,
                    pos_id: pos_id,
                    importe: importe,
                    detalles: detalles
                })
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                });

        }

        function abrirCaja(sucursal_id, pos_id, importe, callback) {
            return $http.post(url, {function: 'abrirCaja', sucursal_id: sucursal_id, pos_id: pos_id, importe: importe})
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                });

        }

        function getSaldoInicial(sucursal_id, pos_id, callback) {
            return $http.get(url + '?function=getSaldoInicial&sucursal_id=' + sucursal_id + '&pos_id=' + pos_id)
                .success(function (data) {
                    callback(data)
                })
                .error(function (data) {
                    callback(data)
                });
        }

        function getSaldoFinalAnterior(sucursal_id, pos_id, callback) {
            return $http.get(url + '?function=getSaldoFinalAnterior&sucursal_id=' + sucursal_id + '&pos_id=' + pos_id)
                .success(function (data) {
                    console.log(data);
                    callback(data)
                })
                .error(function (data) {
                    callback(data)
                });
        }

        function checkEstado(sucursal_id, pos_id, callback) {
            return $http.get(url + '?function=checkEstado&sucursal_id=' + sucursal_id + '&pos_id=' + pos_id)
                .success(function (data) {
                    callback(data)
                })
                .error(function (data) {
                    callback(data)
                });
        }

        function getResultado(cuenta_id, callback) {
            return $http.get(url + '?function=getResultado&cuenta_id=' + cuenta_id)
                .success(function (data) {
                    callback(data)
                })
                .error(function (data) {
                    callback(data)
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