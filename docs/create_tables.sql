
# CAJAS
CREATE TABLE cajas (
  caja_id int(11) NOT NULL AUTO_INCREMENT,
  fecha timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_id varchar(45) DEFAULT NULL,
  asiento_inicio_id int(11) DEFAULT NULL,
  asiento_cierre_id int(11) DEFAULT NULL,
  saldo_inicial decimal(10,2) DEFAULT NULL,
  sucursal_id int(11) NOT NULL,
  detalles varchar(3000) DEFAULT NULL,
  pos_id int(2) DEFAULT '1'
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

# CAJAS DETALLE
CREATE TABLE cajas_detalles (
  caja_detalle_id int(11) NOT NULL AUTO_INCREMENT,
  caja_id int(11) DEFAULT NULL,
  moneda_id int(11) DEFAULT NULL,
  valor_real decimal(10,2) DEFAULT NULL,
  valor_esperado decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;