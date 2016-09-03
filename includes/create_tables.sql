
# ENCOMIENDAS
CREATE TABLE encomiendas (
  encomienda_id int(11) NOT NULL AUTO_INCREMENT,
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
  PRIMARY KEY (encomienda_id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

# ECONMIENDAS DETALLES
CREATE TABLE encomiendas_detalles (
  encomienda_detalle_id int(11) NOT NULL AUTO_INCREMENT,
  encomienda_id int(11) NOT NULL,
  producto_id int(11) NOT NULL,
  cantidad int(11) NOT NULL,
  precio decimal(8,2) DEFAULT NULL,
  PRIMARY KEY (encomienda_detalle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
