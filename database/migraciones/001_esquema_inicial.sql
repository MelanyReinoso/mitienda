-- 001: tablas base de la tienda (tiendas, usuarios, categorías, productos, variantes, pedidos)

-- 🏬 TIENDAS
-- Hoy usamos una sola, pero TODAS las demás tablas llevan id_tienda.
-- Así, más adelante, esto puede convertirse en una plataforma para varios comercios.
CREATE TABLE tiendas (
  id_tienda   INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  slug        VARCHAR(60)  NOT NULL UNIQUE,      -- ej: "mi-tienda" (futuro subdominio)
  creada_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 👤 USUARIOS (clientes y administradores)
-- La contraseña NUNCA se guarda: solo su hash (bcrypt).
CREATE TABLE usuarios (
  id_usuario     INT AUTO_INCREMENT PRIMARY KEY,
  id_tienda      INT          NOT NULL,
  nombre         VARCHAR(80)  NOT NULL,
  apellido       VARCHAR(80)  NOT NULL,
  email          VARCHAR(120) NOT NULL,
  telefono       VARCHAR(30)  NULL,
  password_hash  VARCHAR(255) NOT NULL,
  rol            ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuario_email (id_tienda, email),   -- mismo mail permitido en tiendas distintas
  CONSTRAINT fk_usuario_tienda FOREIGN KEY (id_tienda) REFERENCES tiendas (id_tienda)
) ENGINE=InnoDB;

-- 🗂️ CATEGORÍAS
CREATE TABLE categorias (
  id_categoria  INT AUTO_INCREMENT PRIMARY KEY,
  id_tienda     INT         NOT NULL,
  nombre        VARCHAR(80) NOT NULL,
  UNIQUE KEY uq_categoria (id_tienda, nombre),
  CONSTRAINT fk_categoria_tienda FOREIGN KEY (id_tienda) REFERENCES tiendas (id_tienda)
) ENGINE=InnoDB;

-- 👕 PRODUCTOS (lo que se muestra en el catálogo)
-- El precio y el stock NO están acá: dependen del talle y el color (ver "variantes").
CREATE TABLE productos (
  id_producto   INT AUTO_INCREMENT PRIMARY KEY,
  id_tienda     INT          NOT NULL,
  id_categoria  INT          NULL,
  nombre        VARCHAR(150) NOT NULL,
  descripcion   TEXT         NULL,
  imagen_url    VARCHAR(255) NULL,
  activo        TINYINT(1)   NOT NULL DEFAULT 1,    -- 0 = oculto en la tienda (sin borrarlo)
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_producto_tienda (id_tienda, activo),
  CONSTRAINT fk_producto_tienda    FOREIGN KEY (id_tienda)    REFERENCES tiendas (id_tienda),
  CONSTRAINT fk_producto_categoria FOREIGN KEY (id_categoria) REFERENCES categorias (id_categoria)
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- 📏 VARIANTES (cada combinación de talle + color, con su precio y su stock)
CREATE TABLE variantes (
  id_variante  INT AUTO_INCREMENT PRIMARY KEY,
  id_producto  INT           NOT NULL,
  sku          VARCHAR(50)   NULL,
  talle        VARCHAR(20)   NOT NULL DEFAULT 'Único',
  color        VARCHAR(30)   NOT NULL DEFAULT 'Único',
  precio       DECIMAL(10,2) NOT NULL,
  stock        INT           NOT NULL DEFAULT 0,
  UNIQUE KEY uq_variante (id_producto, talle, color),
  CONSTRAINT chk_variante_precio CHECK (precio > 0),
  CONSTRAINT chk_variante_stock  CHECK (stock >= 0),   -- la base impide stock negativo
  CONSTRAINT fk_variante_producto FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- 🧾 PEDIDOS (cabecera: quién compró, cuánto y en qué estado está)
CREATE TABLE pedidos (
  id_pedido        INT AUTO_INCREMENT PRIMARY KEY,
  id_tienda        INT           NOT NULL,
  id_usuario       INT           NOT NULL,
  estado           ENUM('pendiente','pagado','preparando','enviado','entregado','cancelado')
                   NOT NULL DEFAULT 'pendiente',
  metodo_pago      ENUM('mercadopago','transferencia','tarjeta') NOT NULL,
  subtotal         DECIMAL(10,2) NOT NULL,
  descuento        DECIMAL(10,2) NOT NULL DEFAULT 0,
  total            DECIMAL(10,2) NOT NULL,
  direccion_envio  VARCHAR(255)  NOT NULL,
  creado_en        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pedido_usuario (id_usuario),
  KEY idx_pedido_estado (id_tienda, estado),
  CONSTRAINT fk_pedido_tienda  FOREIGN KEY (id_tienda)  REFERENCES tiendas (id_tienda),
  CONSTRAINT fk_pedido_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
) ENGINE=InnoDB;

-- 🧺 DETALLE DEL PEDIDO (una fila por cada variante comprada)
-- Se copian nombre, talle, color y precio: si mañana cambia el producto,
-- el pedido viejo sigue mostrando lo que realmente se compró y a qué precio.
CREATE TABLE detalle_pedido (
  id_detalle       INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido        INT           NOT NULL,
  id_variante      INT           NOT NULL,
  nombre_producto  VARCHAR(150)  NOT NULL,
  talle            VARCHAR(20)   NOT NULL,
  color            VARCHAR(30)   NOT NULL,
  cantidad         INT           NOT NULL,
  precio_unitario  DECIMAL(10,2) NOT NULL,
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
  CONSTRAINT fk_detalle_pedido   FOREIGN KEY (id_pedido)   REFERENCES pedidos (id_pedido)
    ON DELETE CASCADE,
  CONSTRAINT fk_detalle_variante FOREIGN KEY (id_variante) REFERENCES variantes (id_variante)
) ENGINE=InnoDB;
