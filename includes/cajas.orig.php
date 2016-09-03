<?php
session_start();
require_once '../MyDBi.php';

$data = file_get_contents("php://input");

$decoded = json_decode($data);
if ($decoded != null) {
    if ($decoded->function == 'getCajaDiaria') {
        getCajaDiaria($decoded->sucursal_id, $decoded->pos_id);
    } else if ($decoded->function == 'cerrarCaja') {
        cerrarCaja($decoded->importe, $decoded->sucursal_id, $decoded->pos_id, $decoded->detalles);
    } else if ($decoded->function == 'getSaldoFinal') {
        getSaldoFinal($decoded->sucursal_id, $decoded->pos_id);
    } else if ($decoded->function == 'abrirCaja') {
        abrirCaja($decoded->importe, $decoded->sucursal_id, $decoded->pos_id);
    }
} else {

    $function = $_GET["function"];
    if ($function == 'getCajaDiaria') {
        getCajaDiaria($_GET["sucursal_id"], $_GET["pos_id"]);
    } else if ($function == 'getSaldoInicial') {
        getSaldoInicial($_GET["sucursal_id"], $_GET["pos_id"]);
    } else if ($function == 'getCajas') {
        getCajas();
    } else if ($function == 'getCajaDiariaFromTo') {
        getCajaDiariaFromTo($_GET["sucursal_id"], $_GET["pos_id"], $_GET["asiento_id_inicio"], $_GET["asiento_id_fin"]);
    } else if ($function == 'getMovimientos') {
        getMovimientos($_GET["fecha_desde"], $_GET["fecha_hasta"]);
    } else if ($function == 'totalConcepto') {
        totalConcepto($_GET["where"], $_GET["fecha_desde"], $_GET["fecha_hasta"]);
    } else if ($function == 'checkEstado') {
        checkEstado($_GET["sucursal_id"], $_GET["pos_id"]);
    } else if ($function == 'getSaldoFinalAnterior') {
        getSaldoFinalAnterior($_GET["sucursal_id"], $_GET["pos_id"]);
    } else if ($function == 'getTotalByCuenta') {
        getTotalByCuenta($_GET["cuenta_id"]);
    }
}

/**
 * @description Obtiene el total por cuenta, sin detalle
 * @param $cuenta_id
 */
function getTotalByCuenta($cuenta_id)
{
    $db = new MysqliDb();
    $results = $db->rawQuery('SELECT
        SUM(m.importe) importe,
            (SELECT
                    c.descripcion
                FROM
                    cuentas c
                WHERE
                    m.cuenta_id = c.cuenta_id) nombre
    FROM
        movimientos m
    WHERE
        m.cuenta_id = "' . $cuenta_id . '";');

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

function getCajaDiaria($sucursal_id, $pos_id)
{

    $db = new MysqliDb();
    $lastCaja = getLastCaja($sucursal_id, $pos_id);
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
WHERE m.sucursal_id = " . $sucursal_id . " and asiento_id >= " . $lastCaja['asiento_inicio_id'] . "
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

//
//    $results = $db->rawQuery("select movimiento_id, asiento_id, fecha, cuenta_id, usuario_id, importe, 0 detalles
//from movimientos m where m.sucursal_id = " . $sucursal_id . " and (m.cuenta_id like '1.1.1.%' or m.cuenta_id = '1.1.2.01'
//or m.cuenta_id like '4.1.1.%' or m.cuenta_id like '1.1.7.%')
//    and asiento_id >= " . $lastCaja['asiento_inicio_id'] . " order by asiento_id, movimiento_id;");
//
//    foreach ($results as $row) {
//        $SQL = "select
//detalle_tipo_id,
//case when (detalle_tipo_id = 8) then (select concat(producto_id, ' - ', nombre) from productos where producto_id = valor)
//when (detalle_tipo_id = 3) then (select concat(nombre, ' ', apellido) from clientes where cliente_id = valor)
//else valor
//end detalle
//
// from detallesmovimientos
// where detalle_tipo_id in (2,3,8,9,10,13) and movimiento_id =  " . $row['movimiento_id'] . ";";
//        $detalles = $db->rawQuery($SQL);
//
//        $row["detalles"] = $detalles;
//        array_push($resultsDetalles, $row);
//
//    }
//
//    echo json_encode($resultsDetalles);
}

function getCajaDiariaFromTo($sucursal_id, $pos_id, $asiento_id_inicio, $asiento_id_fin)
{
    $db = new MysqliDb();
    $resultsDetalles = [];

    $params = array($sucursal_id, $pos_id, $asiento_id_inicio, $asiento_id_fin + 1);

    $SQL = "select movimiento_id, asiento_id, fecha, cuenta_id, usuario_id, importe, 0 detalles
from movimientos m where m.sucursal_id = ? and m.pos_id = ? and (m.cuenta_id like '1.1.1.%' or m.cuenta_id = '1.1.2.01'
or m.cuenta_id like '4.1.1.%')
and (asiento_id >= ? and asiento_id < ?);";


    $results = $db->rawQuery($SQL, $params, false);

    foreach ($results as $row) {
        $SQL = "select
detalle_tipo_id,
case when (detalle_tipo_id = 8) then (select nombre from productos where producto_id = valor)
when (detalle_tipo_id = 3) then (select concat(nombre, ' ', apellido) from clientes where cliente_id = valor)
else valor
end detalle

 from detallesmovimientos
 where detalle_tipo_id in (2,3,8,9,10,13) and movimiento_id =  " . $row['movimiento_id'] . ";";
        $detalles = $db->rawQuery($SQL);

        $row["detalles"] = $detalles;
        array_push($resultsDetalles, $row);

    }

    echo json_encode($resultsDetalles);
}

function getSaldoFinal($sucursal_id, $pos_id)
{
    $db = new MysqliDb();
    $lastCaja = getLastCaja($sucursal_id, $pos_id);

    $SQL = "
        Select
    ifnull(sum(m.importe),0) total
from
    movimientos m
where
    m.cuenta_id = '1.1.1.0" . $sucursal_id . "' and pos_id = '" . $pos_id . "'
        and m.asiento_id >= " . $lastCaja['asiento_inicio_id'] . ";";
    $results = $db->rawQuery($SQL);

    echo json_encode($results);


}

function cerrarCaja($importe, $sucursal_id, $pos_id, $detalles)
{
    $db = new MysqliDb();
//    $decoded = json_decode($params);
    $lastCaja = getLastCaja($sucursal_id, $pos_id);
//
//    if (intval($lastCaja["usuario_id"]) !== $decoded[0]->idUsuario) {
//        echo 'usuario';
//        return;
//    }

    if ($lastCaja["asiento_cierre_id"] !== null && $lastCaja["asiento_cierre_id"] !== 0) {
        echo 'cerrada';
        return;
    }

    $db->rawQuery("update cajas set detalles='" . $detalles . "', asiento_cierre_id = (Select max(asiento_id) from movimientos) where
sucursal_id = " . $sucursal_id . " and
pos_id = " . $pos_id . " and
caja_id =" . $lastCaja["caja_id"] . ";");


//    for ($i = 0; $i <= 3; $i++) {
    $data = Array(
        "moneda_id" => 1,
        "valor_real" => $importe,
        "valor_esperado" => $importe,
        "caja_id" => $lastCaja["caja_id"]);
    $db->insert("cajas_detalles", $data);

//    }

    echo "ok";
}

//Obtiene el saldo inicial de caja
function getSaldoInicial($sucursal_id, $pos_id)
{
    $db = new MysqliDb();

    $lastCaja = getLastCaja($sucursal_id, $pos_id);
    echo json_encode($lastCaja["saldo_inicial"]);


}

function getSaldoFinalAnterior($sucursal_id, $pos_id)
{
    $db = new MysqliDb();

//    $lastCaja = getLastCaja($sucursal_id);
//    echo json_encode($lastCaja["saldo_inicial"]);


//    $results = $db->rawQuery("select (select c.detalles from cajas c where c.caja_id = caja_id) detalles, valor_real from cajas_detalles where caja_id = (select max(caja_id) from cajas where sucursal_id = " . $sucursal_id . ");");
    $results = $db->rawQuery("select
(select c.detalles from cajas c
where c.caja_id = (select max(caja_id) from cajas where sucursal_id =" . $sucursal_id . " and pos_id =" . $pos_id . ")) detalles,
valor_real from cajas_detalles where caja_id = (select max(caja_id)
from cajas where sucursal_id =" . $sucursal_id . " and pos_id =" . $pos_id . ");");

    echo json_encode($results);

}

function checkEstado($sucursal_id, $pos_id)
{
    echo json_encode(getLastCaja($sucursal_id, $pos_id));
}

function getLastCaja($sucursal_id, $pos_id)
{
    $db = new MysqliDb();
    $results = $db->rawQuery("select * from cajas where caja_id = (select max(caja_id) from cajas) and sucursal_id=" . $sucursal_id . " and pos_id =" . $pos_id . ";");

    if ($db->count > 0) {
        return $results[0];
    } else {

        return array('asiento_inicio_id' => 9999999, 'asiento_cierre_id' => 9999999, 'saldo_inicial' => 0);
    }
}

//Realiza la apertura de la caja
function abrirCaja($importe, $sucursal_id, $pos_id)
{
    $db = new MysqliDb();

//    $decoded = json_decode($params);
    $lastCaja = getLastCaja($sucursal_id, $pos_id);


    if ($lastCaja['asiento_cierre_id'] === null || $lastCaja['asiento_cierre_id'] === 0) {
        echo 'abierta';
//        echo 'La caja se encuentra abierta';
        return;
    }

    $data = Array(
        'usuario_id' => 1,
        'asiento_inicio_id' => $lastCaja['asiento_cierre_id'] + 1,
        'saldo_inicial' => $importe,
        'sucursal_id' => $sucursal_id,
        'pos_id' => $pos_id
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
    $db = new MysqliDb();
    $results = $db->get('cajas');

    echo json_encode($results);

}