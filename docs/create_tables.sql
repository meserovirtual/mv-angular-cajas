
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
  pos_id int(2) DEFAULT '1',
  PRIMARY KEY (caja_id) 
) ENGINE=InnoDB AUTO_INCREMENT=1;

# CAJAS DETALLE
CREATE TABLE cajas_detalles (
  caja_detalle_id int(11) NOT NULL AUTO_INCREMENT,
  caja_id int(11) DEFAULT NULL,
  moneda_id int(11) DEFAULT NULL,
  valor_real decimal(10,2) DEFAULT NULL,
  valor_esperado decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (caja_detalle_id) 
) ENGINE=InnoDB AUTO_INCREMENT=1;

# ENVIOS
CREATE TABLE envios (
  envio_id int(11) NOT NULL AUTO_INCREMENT,
  fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_entrega TIMESTAMP DEFAULT '0000-00-00',
  usuario_id int(11) DEFAULT NULL,
  cliente_id int(11) DEFAULT NULL,
  total decimal(8,2) DEFAULT NULL,
  calle varchar(100) DEFAULT NULL,
  nro varchar(50) DEFAULT NULL,
  cp varchar(10) DEFAULT NULL,
  provincia_id int(11) DEFAULT NULL,
  ciudad varchar(100) DEFAULT NULL,
  empresa varchar(100) DEFAULT NULL,
  nro_guia varchar(20) DEFAULT '',
  forma_pago varchar(2) DEFAULT '01',
  status int(1) DEFAULT 0 COMMENT '0- Pendiente, 1- Enviada, 2- Entregada',
  descuento decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (envio_id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

# ENVIOS DETALLES
CREATE TABLE envios_detalles (
  envio_detalle_id int(11) NOT NULL AUTO_INCREMENT,
  envio_id int(11) NOT NULL,
  producto_id int(11) NOT NULL,
  cantidad int(11) NOT NULL,
  precio decimal(8,2) DEFAULT NULL,
  PRIMARY KEY (envio_detalle_id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

#Esto en caso de que alguna tabla tenga problemas con el autoincrement
ALTER TABLE arielces_mvtest.usuarios MODIFY usuario_id int(11) AUTO_INCREMENT PRIMARY KEY;