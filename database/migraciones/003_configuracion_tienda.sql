-- 003: la tienda se personaliza desde la base (ya no desde el código)
--   - datos de la tienda: logo, color, contacto
--   - medios de pago con su descuento
--   - métodos de envío con su costo
--   - código de color de cada variante

-- 🏬 Datos de la tienda
ALTER TABLE tiendas
  ADD COLUMN logo_url         VARCHAR(255) NULL,
  ADD COLUMN color_principal  CHAR(7)      NOT NULL DEFAULT '#1d4b3a',
  ADD COLUMN email_contacto   VARCHAR(120) NULL,
  ADD COLUMN whatsapp         VARCHAR(30)  NULL,   -- solo dígitos, con código de país (ej: 5491100000000)
  ADD COLUMN instagram        VARCHAR(60)  NULL,   -- usuario sin @
  ADD COLUMN horario          VARCHAR(120) NULL;

-- 🎨 Cada variante puede guardar el código de su color (#rrggbb)
ALTER TABLE variantes ADD COLUMN color_hex CHAR(7) NULL AFTER color;

-- 💳 Medios de pago de cada tienda. El descuento lo aplica el SERVIDOR al comprar.
CREATE TABLE medios_pago (
  id_tienda             INT NOT NULL,
  codigo                ENUM('mercadopago','transferencia','tarjeta') NOT NULL,
  nombre                VARCHAR(60)  NOT NULL,
  detalle               VARCHAR(120) NULL,
  descuento_porcentaje  DECIMAL(5,2) NOT NULL DEFAULT 0,
  activo                TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id_tienda, codigo),
  CONSTRAINT chk_pago_descuento CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
  CONSTRAINT fk_pago_tienda FOREIGN KEY (id_tienda) REFERENCES tiendas (id_tienda)
) ENGINE=InnoDB;

-- 🚚 Métodos de envío de cada tienda (costo 0 = gratis)
CREATE TABLE metodos_envio (
  id_envio            INT AUTO_INCREMENT PRIMARY KEY,
  id_tienda           INT           NOT NULL,
  nombre              VARCHAR(80)   NOT NULL,
  detalle             VARCHAR(160)  NULL,
  costo               DECIMAL(10,2) NOT NULL DEFAULT 0,
  requiere_direccion  TINYINT(1)    NOT NULL DEFAULT 1,   -- 0 = retiro en el local
  activo              TINYINT(1)    NOT NULL DEFAULT 1,
  orden               INT           NOT NULL DEFAULT 0,
  KEY idx_envio_tienda (id_tienda, activo),
  CONSTRAINT chk_envio_costo CHECK (costo >= 0),
  CONSTRAINT fk_envio_tienda FOREIGN KEY (id_tienda) REFERENCES tiendas (id_tienda)
) ENGINE=InnoDB;

-- 🧾 El pedido guarda cuánto costó el envío y cómo se llamaba (por si después se cambia o borra)
ALTER TABLE pedidos
  ADD COLUMN costo_envio   DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER descuento,
  ADD COLUMN id_envio      INT         NULL,
  ADD COLUMN envio_nombre  VARCHAR(80) NULL,
  ADD CONSTRAINT fk_pedido_envio FOREIGN KEY (id_envio) REFERENCES metodos_envio (id_envio) ON DELETE SET NULL;

-- ---------- Valores iniciales para las tiendas que ya existen ----------
INSERT INTO medios_pago (id_tienda, codigo, nombre, detalle, descuento_porcentaje)
  SELECT id_tienda, 'mercadopago',   'Mercado Pago',                 'Tarjetas y dinero en cuenta', 0  FROM tiendas;
INSERT INTO medios_pago (id_tienda, codigo, nombre, detalle, descuento_porcentaje)
  SELECT id_tienda, 'tarjeta',       'Tarjeta de crédito o débito',  NULL,                          0  FROM tiendas;
INSERT INTO medios_pago (id_tienda, codigo, nombre, detalle, descuento_porcentaje)
  SELECT id_tienda, 'transferencia', 'Transferencia bancaria',       NULL,                          10 FROM tiendas;

INSERT INTO metodos_envio (id_tienda, nombre, detalle, costo, requiere_direccion, orden)
  SELECT id_tienda, 'Envío a domicilio',  'Por correo a todo el país',            4500, 1, 1 FROM tiendas;
INSERT INTO metodos_envio (id_tienda, nombre, detalle, costo, requiere_direccion, orden)
  SELECT id_tienda, 'Retiro en el local', 'Sin costo, coordinamos por WhatsApp',  0,    0, 2 FROM tiendas;

UPDATE tiendas SET
  email_contacto = 'contacto@mitienda.com',
  whatsapp       = '5491100000000',
  instagram      = 'mitienda',
  horario        = 'Lunes a viernes de 9 a 18 h'
WHERE email_contacto IS NULL;

-- Código de color de las variantes que ya existen (la comparación ignora mayúsculas y tildes)
UPDATE variantes SET color_hex = CASE
  WHEN color = 'negro'    THEN '#1d1f1e'
  WHEN color = 'blanco'   THEN '#f3f3ef'
  WHEN color = 'gris'     THEN '#9ba09d'
  WHEN color = 'azul'     THEN '#2e4a7d'
  WHEN color = 'celeste'  THEN '#8fb8de'
  WHEN color = 'rojo'     THEN '#b5342b'
  WHEN color = 'verde'    THEN '#3f7a54'
  WHEN color = 'beige'    THEN '#d8c7a8'
  WHEN color = 'crudo'    THEN '#e6dfd0'
  WHEN color = 'marron'   THEN '#6b4a35'
  WHEN color = 'rosa'     THEN '#e5a3b4'
  WHEN color = 'violeta'  THEN '#6e4f9c'
  WHEN color = 'amarillo' THEN '#e5c04a'
  WHEN color = 'naranja'  THEN '#d9772b'
  WHEN color = 'bordo'    THEN '#6d1f2c'
  ELSE NULL END
WHERE color_hex IS NULL;
