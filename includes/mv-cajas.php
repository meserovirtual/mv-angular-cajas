<?php
session_start();
if (file_exists('../../../includes/MyDBi.php')) {
    require_once '../../../includes/MyDBi.php';
    require_once '../../../includes/utils.php';
} else {
    require_once 'MyDBi.php';
}


class Cajas extends Main
{
    private static $instance;

    public static function init($decoded)
    {
        self::$instance = new Main(get_class(), $decoded['function']);
        try {
            call_user_func(get_class() . '::' . $decoded['function'], $decoded);
        } catch (Exception $e) {

            $file = 'error.log';
            $current = file_get_contents($file);
            $current .= date('Y-m-d H:i:s') . ": " . $e . "\n";
            file_put_contents($file, $current);

            header('HTTP/1.0 500 Internal Server Error');
            echo $e;
        }
    }

    /**
     * @description Obtiene el total por cuenta, sin detalle
     * @param $cuenta_id
     */
    function getTotalByCuenta($params)
    {
        $db = self::$instance->db;
        $results = $db->rawQuery('SELECT
        IFNULL(SUM(m.importe),0) importe,
            (SELECT
                    c.descripcion
                FROM
                    cuentas c
                WHERE
                    m.cuenta_id = c.cuenta_id) nombre
    FROM
        movimientos m
    WHERE
        m.cuenta_id = "' . $params['cuenta_id'] . '" and m.sucursal_id=' . $params['sucursal_id'] . ';');

        echo json_encode($results);
    }

// Movimientos que modifican el estado de cuentas
    function getMovimientos($fecha_desde, $fecha_hasta)
    {
        $db = new MysqliDb();
        $resultsDetalles = [];

//    $SQL = "select movimiento_id, asiento_id, fecha, c.cuenta_id, c.descripcion, usuario_id, importe, 0 general, 0 control, 0 ca, 0 cc, 0 me,
//0 detalles
//from movimientos m inner join cuentas c on m.cuenta_id = c.cuenta_id where (m.cuenta_id like '1.1.1.2%' or m.cuenta_id = '1.1.1.10' or m.cuenta_id = '1.1.4.01')
//and (fecha between '" . $fecha_desde . "' and '" . $fecha_hasta . "');";


        $SQL = "SELECT
    movimiento_id,
    asiento_id,
    (SELECT
            valor
        FROM
            detallesmovimientos d
        WHERE
            d.movimiento_id = m.movimiento_id
                AND detalle_tipo_id = 2) detalle,
    DATE_FORMAT(fecha,'%d-%m-%Y') fecha,
    c.cuenta_id,
    c.descripcion,
    usuario_id,
    importe,
    CASE when m.cuenta_id = '1.1.1.10' then importe else 0 end general,
    CASE when m.cuenta_id = '1.1.1.10' then importe else 0 end control,
    CASE when m.cuenta_id = '1.1.1.22' then importe else 0 end ca,
    CASE when m.cuenta_id = '1.1.1.21' then importe else 0 end cc,
    CASE when m.cuenta_id = '1.1.1.10' then importe else 0 end me,
    CASE when m.cuenta_id = '1.1.1.24' then importe else 0 end mp,
    CASE when m.cuenta_id = '1.1.4.01' then importe else 0 end ta
FROM
    movimientos m
        INNER JOIN
    cuentas c ON m.cuenta_id = c.cuenta_id
WHERE
    (m.cuenta_id LIKE '1.1.1.2%'
        OR m.cuenta_id = '1.1.1.10'
        OR m.cuenta_id = '1.1.4.01')
        AND (fecha BETWEEN '" . $fecha_desde . "' and '" . $fecha_hasta . "');";


//or m.cuenta_id = '1.1.7.01'
//or m.cuenta_id = '1.2.1.01'
//or m.cuenta_id = '1.3.1.01'
//or m.cuenta_id = '1.3.2.01'
//or m.cuenta_id = '1.3.3.01'
//or m.cuenta_id = '2.1.1.01'
//or m.cuenta_id = '2.1.2.01'
//or m.cuenta_id like '4.2.1.%'
//or m.cuenta_id like '5.2.1.%'
//or m.cuenta_id = '5.2.2.01'
//or m.cuenta_id = '5.2.3.01'
//or m.cuenta_id like '5.2.4.%'
//or m.cuenta_id like '5.2.5.%'
//or m.cuenta_id like '5.2.8.%'
//or m.cuenta_id = '5.3.1.01'

        $results = $db->rawQuery($SQL);

//    foreach ($results as $row) {
//        $SQL = "select
//detalle_tipo_id,
//valor detalle
//
// from detallesmovimientos
// where detalle_tipo_id in (2) and movimiento_id =  " . $row['movimiento_id'] . ";";
//        $detalles = $db->rawQuery($SQL);
//
//        $row["detalles"] = $detalles;
//        array_push($resultsDetalles, $row);
//
//    }

        echo json_encode($results);
    }

// Movimientos que modifican el estado de cuentas
    function totalConcepto($where, $fecha_desde, $fecha_hasta)
    {
        $db = new MysqliDb();
        $resultsDetalles = [];

        $SQL = "select movimiento_id, asiento_id, fecha, c.cuenta_id, c.descripcion, usuario_id, importe, 0 general, 0 control, 0 ca, 0 cc, 0 me,
0 detalles
from movimientos m inner join cuentas c on m.cuenta_id = c.cuenta_id
where " . $where . " and (fecha between '" . $fecha_desde . "' and '" . $fecha_hasta . "');";

        $results = $db->rawQuery($SQL);

        foreach ($results as $row) {
            $SQL = "select
detalle_tipo_id,
valor detalle

 from detallesmovimientos
 where detalle_tipo_id in (2) and movimiento_id =  " . $row['movimiento_id'] . ";";
            $detalles = $db->rawQuery($SQL);

            $row["detalles"] = $detalles;
            array_push($resultsDetalles, $row);

        }

        echo json_encode($resultsDetalles);
    }

    function getCajaDiaria($params)
    {

        $db = self::$instance->db;
        $lastCaja = self::getLastCaja($params['sucursal_id'], $params['pos_id']);
        $resultsDetalles = [];


        $SQL = "SELECT
    m.movimiento_id,
    m.asiento_id,
    m.fecha,
    m.cuenta_id,
    m.usuario_id,
    (SELECT
            CONCAT(nombre, ' ', apellido)
        FROM
            usuarios
        WHERE
            usuario_id = m.usuario_id) nombreUsuario,
    m.importe,
    m.sucursal_id,
    m.pos_id,
    d.detalle_movimiento_id,
    d.detalle_tipo_id,
    d.valor,
    CASE
        WHEN d.detalle_tipo_id IN (2 , 9, 10, 13) THEN d.valor
        WHEN
            d.detalle_tipo_id = 8
        THEN
            (SELECT
                    CONCAT(nombre)
                FROM
                    productos
                WHERE
                    producto_id = d.valor)
        WHEN
            d.detalle_tipo_id IN (12)
        THEN
            (SELECT
                    CONCAT(nombre)
                FROM
                    sucursales
                WHERE
                    sucursal_id = d.valor)
        WHEN
            d.detalle_tipo_id IN (14)
        THEN
            (SELECT
                    CONCAT(nombre, ' ', apellido)
                FROM
                    usuarios
                WHERE
                    usuario_id = d.valor)
    END AS texto
FROM
    movimientos m
        INNER JOIN
    detallesmovimientos d ON m.movimiento_id = d.movimiento_id
WHERE m.sucursal_id = " . $params['sucursal_id'] . " and asiento_id >= " . $lastCaja['asiento_inicio_id'] . "
GROUP BY m.movimiento_id , m.asiento_id , m.fecha , m.cuenta_id , m.usuario_id , m.importe , m.sucursal_id , m.pos_id , d.detalle_movimiento_id , d.detalle_tipo_id , d.valor , texto
ORDER BY m.movimiento_id, m.asiento_id, m.cuenta_id asc;";

        $results = $db->rawQuery($SQL);
        $final = array();
        foreach ($results as $row) {

            if (!isset($final[$row["asiento_id"]])) {
                $final[$row["asiento_id"]] = array(
                    'asiento_id' => $row["asiento_id"],
                    'fecha' => $row["fecha"],
                    'usuario_id' => $row["usuario_id"],
                    'usuario' => $row["nombreUsuario"],
                    'sucursal_id' => $row["sucursal_id"],
                    'pos_id' => $row["pos_id"],
                    'movimientos' => array()
                );
            }
            $have_mov = false;
            if ($row["movimiento_id"] !== null) {

                if (sizeof($final[$row['asiento_id']]['movimientos']) > 0) {
                    foreach ($final[$row['asiento_id']]['movimientos'] as $key => $cat) {
                        if ($cat['movimiento_id'] == $row["movimiento_id"]) {
                            $have_mov = true;
                            array_push($cat['detalles'], array(
                                    'detalle_movimiento_id' => $row['detalle_movimiento_id'],
                                    'detalle_tipo_id' => $row['detalle_tipo_id'],
                                    'valor' => $row['valor'],
                                    'texto' => $row['texto'],
                                )
                            );
                            $final[$row['asiento_id']]['movimientos'][$key]['detalles'] = $cat['detalles'];
                        }
                    }
                } else {

                    $dets = array();
                    array_push($dets, array('detalle_movimiento_id' => $row['detalle_movimiento_id'],
                        'detalle_tipo_id' => $row['detalle_tipo_id'],
                        'valor' => $row['valor'],
                        'texto' => $row['texto']));

                    $final[$row['asiento_id']]['movimientos'][] = array(
                        'movimiento_id' => $row['movimiento_id'],
                        'cuenta_id' => $row["cuenta_id"],
                        'importe' => $row["importe"],
                        'detalles' => $dets
                    );

                    $have_mov = true;
                }

                if (!$have_mov) {

                    $dets = array();
                    array_push($dets, array('detalle_movimiento_id' => $row['detalle_movimiento_id'],
                        'detalle_tipo_id' => $row['detalle_tipo_id'],
                        'valor' => $row['valor'],
                        'texto' => $row['texto']));

                    array_push($final[$row['asiento_id']]['movimientos'], array(
                        'movimiento_id' => $row['movimiento_id'],
                        'cuenta_id' => $row["cuenta_id"],
                        'importe' => $row["importe"],
                        'detalles' => $dets
                    ));
                }
            }
        }
        echo json_encode(array_values($final));

    }

    function getCajaDiariaFromTo($params)
    {
        $db = self::$instance->db;
        $resultsDetalles = [];

        if($params['asiento_id_fin'] != null) {
            $asiento_fin = $params['asiento_id_fin'] + 1;

            $SQL = "SELECT movimiento_id, asiento_id, fecha, cuenta_id, usuario_id, importe, 0 detalles
                FROM movimientos m WHERE m.sucursal_id = " . $params['sucursal_id'] . " AND m.pos_id = " . $params['pos_id'] . " AND
                (m.cuenta_id LIKE '1.1.1.%' or m.cuenta_id = '1.1.2.01' OR m.cuenta_id LIKE '4.1.1.%')
                AND (asiento_id >= " . $params['asiento_id_inicio'] . " and asiento_id < " . $asiento_fin . ")
                ORDER BY movimiento_id;";
        } else {
            $SQL = "SELECT movimiento_id, asiento_id, fecha, cuenta_id, usuario_id, importe, 0 detalles
                FROM movimientos m WHERE m.sucursal_id = " . $params['sucursal_id'] . " AND m.pos_id = " . $params['pos_id'] . " AND
                (m.cuenta_id LIKE '1.1.1.%' or m.cuenta_id = '1.1.2.01' OR m.cuenta_id LIKE '4.1.1.%')
                AND (asiento_id >= " . $params['asiento_id_inicio'] . ")
                ORDER BY movimiento_id;";
        }

        $results = $db->rawQuery($SQL, $params, false);

        foreach ($results as $row) {
            $SQL = "SELECT detalle_tipo_id,
                    CASE WHEN (detalle_tipo_id = 8) THEN (select nombre from productos where producto_id = valor)
                        WHEN (detalle_tipo_id = 3) THEN (select concat(nombre, ' ', apellido) from usuarios where usuario_id = valor)
                    ELSE valor END detalle
                    FROM detallesmovimientos
                    WHERE detalle_tipo_id in (2,3,8,9,10,13) and movimiento_id =  " . $row['movimiento_id'] . ";";
            $detalles = $db->rawQuery($SQL);

            $row["detalles"] = $detalles;
            array_push($resultsDetalles, $row);
        }

        echo json_encode($resultsDetalles);
    }

    function getSaldoFinal($params)
    {
        $db = self::$instance->db;
        $lastCaja = self::getLastCaja($params['sucursal_id'], $params['pos_id']);

        $SQL = "
        Select
    ifnull(sum(m.importe),0) total
from
    movimientos m
where
    m.cuenta_id = '1.1.1.0" . $params['sucursal_id'] . "' and pos_id = '" . $params['pos_id'] . "'
        and m.asiento_id >= " . $lastCaja['asiento_inicio_id'] . ";";
        $results = $db->rawQuery($SQL);

        echo json_encode($results);


    }

    function cerrarCaja($params)
    {
        $db = self::$instance->db;
//    $decoded = json_decode($params);
        $lastCaja = self::getLastCaja($params['sucursal_id'], $params['pos_id']);
//
//    if (intval($lastCaja["usuario_id"]) !== $decoded[0]->idUsuario) {
//        echo 'usuario';
//        return;
//    }

        if ($lastCaja["asiento_cierre_id"] !== null && $lastCaja["asiento_cierre_id"] !== 0) {
            echo 'cerrada';
            return;
        }

        $db->rawQuery("update cajas set detalles='" . $params['detalles'] . "', asiento_cierre_id = (Select max(asiento_id) from movimientos) where
sucursal_id = " . $params['sucursal_id'] . " and
pos_id = " . $params['pos_id'] . " and
caja_id =" . $lastCaja["caja_id"] . ";");


//    for ($i = 0; $i <= 3; $i++) {
        $data = Array(
            "moneda_id" => 1,
            "valor_real" => $params['importe'],
            "valor_esperado" => $params['importe'],
            "caja_id" => $lastCaja["caja_id"]);
        $db->insert("cajas_detalles", $data);

//    }

        echo "ok";
    }

//Obtiene el saldo inicial de caja
    function getSaldoInicial($params)
    {
        $db = self::$instance->db;
        $lastCaja = self::getLastCaja($params['sucursal_id'], $params['pos_id']);
        echo json_encode($lastCaja["saldo_inicial"]);
    }

    function getSaldoFinalAnterior($params)
    {
        $db = self::$instance->db;

//    $lastCaja = getLastCaja($sucursal_id);
//    echo json_encode($lastCaja["saldo_inicial"]);


//    $results = $db->rawQuery("select (select c.detalles from cajas c where c.caja_id = caja_id) detalles, valor_real from cajas_detalles where caja_id = (select max(caja_id) from cajas where sucursal_id = " . $sucursal_id . ");");
        $results = $db->rawQuery("select
(select c.detalles from cajas c
where c.caja_id = (select max(caja_id) from cajas where sucursal_id =" . $params['sucursal_id'] . " and pos_id =" . $params['pos_id'] . ")) detalles,
valor_real from cajas_detalles where caja_id = (select max(caja_id)
from cajas where sucursal_id =" . $params['sucursal_id'] . " and pos_id =" . $params['pos_id'] . ");");

        echo json_encode($results);

    }

    function checkEstado($params)
    {
        echo json_encode(self::getLastCaja($params['sucursal_id'], $params['pos_id']));
    }

    function getLastCaja($sucursal_id, $pos_id)
    {
        $db = self::$instance->db;
        $results = $db->rawQuery("select * from cajas where caja_id = (select max(caja_id) from cajas where sucursal_id=" . $sucursal_id . " and pos_id =" . $pos_id . ") and sucursal_id=" . $sucursal_id . " and pos_id =" . $pos_id . ";");

        if ($db->count > 0) {
            return $results[0];
        } else {

            return array('asiento_inicio_id' => 9999999, 'asiento_cierre_id' => 9999999, 'saldo_inicial' => 0);
        }
    }

//Realiza la apertura de la caja
    function abrirCaja($params)
    {
        $db = self::$instance->db;

//    $decoded = json_decode($params);
        $lastCaja = self::getLastCaja($params['sucursal_id'], $params['pos_id']);


        if ($lastCaja['asiento_cierre_id'] === null || $lastCaja['asiento_cierre_id'] === 0) {
            echo 'abierta';
//        echo 'La caja se encuentra abierta';
            return;
        }

        $data = Array(
            'usuario_id' => 1,
            'asiento_inicio_id' => $lastCaja['asiento_cierre_id'] + 1,
            'saldo_inicial' => $params['importe'],
            'sucursal_id' => $params['sucursal_id'],
            'pos_id' => $params['pos_id']
        );

        $id = $db->insert('cajas', $data);

        if ($id) {
            echo $id;
        } else {
            echo json_encode($db->getLastError());
        }

    }

    function getCajasBySucursalId($sucursal_id, $pos_id)
    {
        $db = new MysqliDb();
        $db->where('sucursal_id', $sucursal_id);
        $db->where('pos_id', $pos_id);
        $results = $db->get('cajas');

        echo json_encode($results);

    }

    function getCajas()
    {
        $db = self::$instance->db;
        //$results = $db->get('cajas');
        $results = $db->rawQuery('SELECT * FROM cajas ORDER BY fecha DESC');

        echo json_encode($results);

    }


    function getResultado($params)
    {
        $db = self::$instance->db;

        $results = $db->rawQuery('select * from resultados where cuenta_id = "' . $params['cuenta_id'] . '" AND mes = Month(last_day(date_sub(now(),interval 30 day)))
        AND anio = Year(last_day(date_sub(now(),interval 30 day)))');

        if ($db->count > 0) {
            header('HTTP/1.0 200 Ok');
            echo json_encode($results);
        } else {
            header('HTTP/1.0 500 Internal Server Error');
            echo json_encode($db->getLastError());
        }
    }

    function createEncomienda($params)
    {
        $db = self::$instance->db;
        $db->startTransaction();
        $item_decoded = self::checkEncomienda(json_decode($params["encomienda"]));

        $data = array(
            'usuario_id' => $item_decoded->usuario_id,
            'cliente_id' => $item_decoded->cliente_id,
            'forma_pago' => $item_decoded->forma_pago,
            'total' => $item_decoded->total,
            'calle' => $item_decoded->calle,
            'nro' => $item_decoded->nro,
            'cp' => $item_decoded->cp,
            'provincia_id' => $item_decoded->provincia_id,
            'ciudad' => $item_decoded->ciudad,
            'empresa' => $item_decoded->empresa,
            'nro_guia' => $item_decoded->nro_guia,
            'status' => $item_decoded->status,
            'fecha_entrega' => substr($item_decoded->fecha_entrega, 0, 10),
            'descuento' => $item_decoded->descuento
        );

        $result = $db->insert('encomiendas', $data);
        if ($result > -1) {

            foreach ($item_decoded->detalles as $detalle) {
                if (!self::createEncomiendaDetalles($detalle, $result, $db)) {
                    $db->rollback();
                    header('HTTP/1.0 500 Internal Server Error');
                    echo $db->getLastError();
                    return;
                }
            }


            $db->commit();
            header('HTTP/1.0 200 Ok');
            echo json_encode($result);
        } else {
            $db->rollback();
            header('HTTP/1.0 500 Internal Server Error');
            echo $db->getLastError();
        }

    }

    function updateEncomienda($params)
    {
        $db = self::$instance->db;
        $db->startTransaction();
        $item_decoded = self::checkEncomienda(json_decode($params["encomienda"]));


        $db->where('encomienda_id', $item_decoded->encomienda_id);
        $data = array(
            'usuario_id' => $item_decoded->usuario_id,
            'cliente_id' => $item_decoded->cliente_id,
            'forma_pago' => $item_decoded->forma_pago,
            'total' => $item_decoded->total,
            'calle' => $item_decoded->calle,
            'nro' => $item_decoded->nro,
            'cp' => $item_decoded->cp,
            'provincia_id' => $item_decoded->provincia_id,
            'ciudad' => $item_decoded->ciudad,
            'empresa' => $item_decoded->empresa,
            'nro_guia' => $item_decoded->nro_guia,
            'status' => $item_decoded->status,
            'fecha_entrega' => substr($item_decoded->fecha_entrega, 0, 10),
            'descuento' => $item_decoded->descuento
        );

        $result = $db->update('encomiendas', $data);


//        $db->where('encomienda_id', $item_decoded->encomienda_id);
//        $db->delete('encomiendas_detalles');


        if ($result) {

//            foreach ($item_decoded->detalles as $detalle) {
//                if (!self::createEncomiendaDetalles($detalle, $item_decoded->encomienda_id, $db)) {
//                    $db->rollback();
//                    header('HTTP/1.0 500 Internal Server Error');
//                    echo $db->getLastError();
//                    return;
//                }
//            }

            $db->commit();
            header('HTTP/1.0 200 Ok');
            echo json_encode($result);
        } else {
            $db->rollback();
            header('HTTP/1.0 500 Internal Server Error');
            echo $db->getLastError();
        }
    }

    function createEncomiendaDetalles($detalle, $encomienda_id, $db)
    {
        $item_decoded = self::checkEncomiendaDetalle($detalle);
        $data = array(
            'encomienda_id' => $encomienda_id,
            'producto_id' => $item_decoded->producto_id,
            'cantidad' => $item_decoded->cantidad,
            'precio' => $item_decoded->precio_unidad
        );
        $result = $db->insert('encomiendas_detalles', $data);
        return $result > 0;
    }

    function getEncomiendas($params)
    {
        $db = self::$instance->db;
        $results = $db->rawQuery('SELECT
    e.encomienda_id,
    e.fecha,
    e.fecha_entrega,
    e.usuario_id,
    e.forma_pago,
    u.nombre nombreUsuario,
    u.apellido apellidoUsuario,
    e.cliente_id,
    c.nombre nombreCliente,
    c.apellido apellidoCliente,
    e.total,
    e.calle,
    e.nro,
    e.cp,
    e.provincia_id,
    e.ciudad,
    e.empresa,
    e.nro_guia,
    e.status,
    d.encomienda_detalle_id,
    d.producto_id,
    COALESCE(NULLIF(p.nombre, ""), "Costo de Envio") nombre,
    d.cantidad,
    d.precio,
    e.descuento
FROM
    encomiendas e
        LEFT JOIN
    encomiendas_detalles d ON e.encomienda_id = d.encomienda_id
        LEFT JOIN
    usuarios u ON e.usuario_id = u.usuario_id
        LEFT JOIN
    usuarios c ON e.cliente_id = c.usuario_id
        LEFT JOIN
    productos p ON d.producto_id = p.producto_id ' . (($params['all'] == 'true') ? ' WHERE e.status in(0,1) ' : ' WHERE e.status = 0 ') . ' ORDER BY e.fecha;');


        $final = array();
        foreach ($results as $row) {

            if (!isset($final[$row["encomienda_id"]])) {
                $final[$row["encomienda_id"]] = array(
                    'encomienda_id' => $row["encomienda_id"],
                    'fecha' => $row["fecha"],
                    'fecha_entrega' => $row["fecha_entrega"],
                    'usuario_id' => $row["usuario_id"],
                    'usuario' => $row["nombreUsuario"] . ' ' . $row["apellidoUsuario"],
                    'cliente_id' => $row["cliente_id"],
                    'cliente' => $row["nombreCliente"] . ' ' . $row["apellidoCliente"],
                    'forma_pago' => $row["forma_pago"],
                    'total' => $row["total"],
                    'calle' => $row["calle"],
                    'nro' => $row["nro"],
                    'cp' => $row["cp"],
                    'provincia_id' => $row["provincia_id"],
                    'ciudad' => $row["ciudad"],
                    'empresa' => $row["empresa"],
                    'nro_guia' => $row["nro_guia"],
                    'status' => $row["status"],
                    'descuento' => $row["descuento"],
                    'detalles' => array()
                );
            }
            $have_det = false;
            if ($row["encomienda_detalle_id"] !== null) {

                if (sizeof($final[$row['encomienda_id']]['detalles']) > 0) {
                    foreach ($final[$row['encomienda_id']]['detalles'] as $cat) {
                        if ($cat['encomienda_detalle_id'] == $row["encomienda_detalle_id"]) {
                            $have_det = true;
                        }
                    }
                } else {
                    $final[$row['encomienda_id']]['detalles'][] = array(
                        'encomienda_detalle_id' => $row['encomienda_detalle_id'],
                        'producto_id' => $row['producto_id'],
                        'cantidad' => $row['cantidad'],
                        'precio' => $row['precio'],
                        'nombre' => $row['nombre']
                    );

                    $have_det = true;
                }

                if (!$have_det) {
                    array_push($final[$row['encomienda_id']]['detalles'], array(
                        'encomienda_detalle_id' => $row['encomienda_detalle_id'],
                        'producto_id' => $row['producto_id'],
                        'cantidad' => $row['cantidad'],
                        'precio' => $row['precio'],
                        'nombre' => $row['nombre']
                    ));
                }
            }

        }
        echo json_encode(array_values($final));

    }

    function checkEncomienda($encomienda)
    {
        $encomienda->fecha_entrega = (!array_key_exists("fecha_entrega", $encomienda)) ? '0000-00-00' : $encomienda->fecha_entrega;
        $encomienda->usuario_id = (!array_key_exists("usuario_id", $encomienda)) ? 0 : $encomienda->usuario_id;
        $encomienda->cliente_id = (!array_key_exists("cliente_id", $encomienda)) ? 0 : $encomienda->cliente_id;
        $encomienda->forma_pago = (!array_key_exists("forma_pago", $encomienda)) ? 0 : $encomienda->forma_pago;
        $encomienda->total = (!array_key_exists("total", $encomienda)) ? 0.0 : $encomienda->total;
        $encomienda->calle = (!array_key_exists("calle", $encomienda)) ? '' : $encomienda->calle;
        $encomienda->nro = (!array_key_exists("nro", $encomienda)) ? 0 : $encomienda->nro;
        $encomienda->cp = (!array_key_exists("cp", $encomienda)) ? 0 : $encomienda->cp;
        $encomienda->provincia_id = (!array_key_exists("provincia_id", $encomienda)) ? 0 : $encomienda->provincia_id;
        $encomienda->ciudad = (!array_key_exists("ciudad", $encomienda)) ? '' : $encomienda->ciudad;
        $encomienda->empresa = (!array_key_exists("empresa", $encomienda)) ? '' : $encomienda->empresa;
        $encomienda->nro_guia = (!array_key_exists("nro_guia", $encomienda)) ? 0 : $encomienda->nro_guia;
        $encomienda->status = (!array_key_exists("status", $encomienda)) ? 0 : $encomienda->status;
        $encomienda->descuento = (!array_key_exists("descuento", $encomienda)) ? 0 : $encomienda->descuento;
        return $encomienda;
    }

    function checkEncomiendaDetalle($encomienda_detalle)
    {
        $encomienda_detalle->encomienda_id = (!array_key_exists("encomienda_id", $encomienda_detalle)) ? '' : $encomienda_detalle->encomienda_id;
        $encomienda_detalle->producto_id = (!array_key_exists("producto_id", $encomienda_detalle)) ? '' : $encomienda_detalle->producto_id;
        $encomienda_detalle->cantidad = (!array_key_exists("cantidad", $encomienda_detalle)) ? 0 : $encomienda_detalle->cantidad;
        $encomienda_detalle->precio_unidad = (!array_key_exists("precio_unidad", $encomienda_detalle)) ? '' : $encomienda_detalle->precio_unidad;
        return $encomienda_detalle;
    }
}


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = file_get_contents("php://input");
    $decoded = json_decode($data);
    Cajas::init(json_decode(json_encode($decoded), true));
} else {
    Cajas::init($_GET);
}