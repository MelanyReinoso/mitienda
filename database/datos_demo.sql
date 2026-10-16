-- Datos de ejemplo para probar.
-- Cargalos con:  npm run datos-demo   (desde la carpeta backend)
-- o en phpMyAdmin: elegí la base "mitienda" -> Importar -> este archivo.
-- Hacelo DESPUÉS de crear las tablas con:  npm run migrar

INSERT INTO tiendas (id_tienda, nombre, slug, color_principal, email_contacto, whatsapp, instagram, horario) VALUES
  (1, 'Mi Tienda', 'mi-tienda', '#1d4b3a', 'contacto@mitienda.com', '5491100000000', 'mitienda', 'Lunes a viernes de 9 a 18 h');

INSERT INTO medios_pago (id_tienda, codigo, nombre, detalle, descuento_porcentaje) VALUES
  (1, 'mercadopago',   'Mercado Pago',                'Tarjetas y dinero en cuenta', 0),
  (1, 'tarjeta',       'Tarjeta de crédito o débito', NULL,                          0),
  (1, 'transferencia', 'Transferencia bancaria',      NULL,                          10);

INSERT INTO metodos_envio (id_tienda, nombre, detalle, costo, requiere_direccion, orden) VALUES
  (1, 'Envío a domicilio',  'Por correo a todo el país',           4500, 1, 1),
  (1, 'Retiro en el local', 'Sin costo, coordinamos por WhatsApp', 0,    0, 2);

INSERT INTO categorias (id_categoria, id_tienda, nombre) VALUES
  (1, 1, 'Hombre'), (2, 1, 'Mujer'), (3, 1, 'Unisex');

INSERT INTO productos (id_producto, id_tienda, id_categoria, nombre, descripcion, imagen_url) VALUES
  (1, 1, 3, 'Campera Universitaria', 'Campera de algodón con detalles bordados.', NULL),
  (2, 1, 1, 'Remera Oversize',       'Remera de algodón peinado, calce amplio.',  NULL),
  (3, 1, 2, 'Jean Wide Leg',         'Jean de tiro alto y pierna ancha.',         NULL),
  (4, 1, 3, 'Buzo con Capucha',      'Buzo de friza con bolsillo canguro.',       NULL);

INSERT INTO variantes (id_producto, sku, talle, color, color_hex, precio, stock) VALUES
  (1, 'CAM-UNI-M-NEG', 'M',  'Negro',  '#1d1f1e', 42000.00, 10),
  (1, 'CAM-UNI-L-NEG', 'L',  'Negro',  '#1d1f1e', 42000.00,  6),
  (2, 'REM-OVE-M-BLA', 'M',  'Blanco', '#f3f3ef', 16290.00, 12),
  (2, 'REM-OVE-L-BLA', 'L',  'Blanco', '#f3f3ef', 16290.00,  1),
  (2, 'REM-OVE-M-NEG', 'M',  'Negro',  '#1d1f1e', 16290.00,  8),
  (3, 'JEA-WID-38-AZU','38', 'Azul',   '#2e4a7d', 23000.00,  0),
  (3, 'JEA-WID-40-AZU','40', 'Azul',   '#2e4a7d', 23000.00,  4),
  (4, 'BUZ-CAP-M-GRI', 'M',  'Gris',   '#9ba09d', 30690.00,  5),
  (4, 'BUZ-CAP-L-GRI', 'L',  'Gris',   '#9ba09d', 30690.00,  5);

-- El usuario administrador se crea con:  npm run crear-admin   (así la contraseña queda hasheada)
