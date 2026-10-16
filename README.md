# Mi Tienda

Base de una tienda online de **indumentaria** con panel de administración, pensada para que un negocio la personalice
(nombre, logo, color, contacto, medios de pago y envíos se cambian desde el panel, sin tocar código) y para crecer
hacia una plataforma con varias tiendas. Hecha con **Node.js + Express + MySQL** (API) y **React + Vite** (frontend).

## Capturas
Las imágenes viven en `docs/capturas/`. Agregá las tuyas con estos nombres y se ven acá:

| Catálogo | Producto | Checkout |
|---|---|---|
| ![Catálogo](docs/capturas/catalogo.png) | ![Producto](docs/capturas/producto.png) | ![Checkout](docs/capturas/checkout.png) |

| Apariencia (modelos) | Ventas (admin) | Productos (admin) |
|---|---|---|
| ![Apariencia](docs/capturas/apariencia.png) | ![Ventas](docs/capturas/ventas.png) | ![Productos](docs/capturas/productos.png) |

## Qué incluye hoy
- Base de datos con productos, **variantes** (talle y color con su precio, stock y código de color), pedidos y detalle.
- **Migraciones versionadas** (`npm run migrar`): crear o actualizar la base sin perder datos.
- Registro, login (bcrypt + JWT) y **recuperar contraseña** por email (o por la terminal en modo desarrollo).
- Roles `cliente` y `admin`, verificados en el servidor.
- **Pagos con Mercado Pago** (Checkout Pro): el cliente paga en Mercado Pago y el pedido pasa solo a "Pagado". Es opcional: sin credenciales, funciona como antes.
- **Ventas (admin)**: lista de todos los pedidos con filtro por estado, detalle de cada uno, cambio de estado (pagado, preparando, enviado, entregado) y cancelación que devuelve el stock. Arriba, un resumen de lo vendido.
- **Modelos de diseño** (Clásico, Minimal, Urbano, Boutique, Fresco) elegibles desde el panel, con vista previa, y ajustes de color, esquinas, tamaño de las prendas, aviso superior y portada.
- **Configuración de la tienda desde la base de datos**: nombre, logo, color, contacto, medios de pago (con descuento) y métodos de envío (con costo).
- Compra segura: **precio, descuento, costo de envío y stock se calculan en el servidor**, dentro de una transacción.
- **Multi-tienda preparado**: cada pedido se resuelve a una tienda y todas las consultas se limitan a ella.
- **Checkout** (envío, dirección, medio de pago, total con descuento y envío) y **Mis pedidos** con el detalle de cada compra.
- **Administración de productos**: crear, editar, ocultar y eliminar, con **foto subida desde la computadora** y variantes (talle, color, precio y stock).
- Panel de pedidos para el admin con estados (devuelve el stock al cancelar) y administración de categorías.

## Puesta en marcha
1. Encendé **MySQL** (XAMPP). No hace falta crear nada en phpMyAdmin.
2. **Backend**, en una terminal:
   ```
   cd backend
   npm install
   copy .env.example .env
   ```
   Completá el `.env` (datos de MySQL y `JWT_SECRET`; la ayuda está dentro del archivo). Generá el `JWT_SECRET` con:
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
3. **Base de datos** (desde `backend`):
   ```
   npm run migrar        crea la base y las tablas (o aplica los cambios nuevos)
   npm run datos-demo    carga una tienda de ejemplo (solo si la base está vacía)
   npm run crear-admin   crea tu usuario administrador
   ```
4. **Levantar la API:** `npm start` → tiene que decir `✅ Conectado a MySQL` y `🚀 API corriendo en http://localhost:4100`.
5. **Frontend**, en otra terminal:
   ```
   cd frontend
   copy .env.example .env
   npm install
   npm run dev
   ```
   Abrí http://localhost:5173.

### Si ya tenías la base de una versión anterior
No la borres ni la reimportes. Con la API apagada corré `npm install` y `npm run migrar` en `backend`: detecta lo que ya tenías
y aplica solo lo nuevo, sin perder datos.

## Personalizar la tienda
Entrá como admin y usá el menú:
- **Configuración → Apariencia**: elegís un modelo de diseño (cambia colores, tipografía, esquinas y forma de las fotos), ajustás el color de la marca, las esquinas y cuántas prendas se ven por fila, y escribís un aviso arriba de todo y un título/texto de portada. Se ve una vista previa antes de guardar.
- **Configuración**: nombre, logo, email, WhatsApp, Instagram, horario, medios de pago (activar, nombre, detalle, descuento) y métodos de envío (costo, si pide dirección).
  Los cambios se ven al instante en el menú, el pie de página y los colores.
- **Productos**: lista con búsqueda, crear, editar, ocultar/mostrar y eliminar. Cada variante (talle y color) se guarda por separado. La foto se sube desde la computadora (JPG, PNG o WebP, hasta 3 MB).
- **Categorías**: agregar, renombrar y eliminar (los productos de una categoría eliminada quedan sin categoría).

## Recuperar contraseña
- **Sin configurar nada** el link aparece en la terminal del backend (modo desarrollo): copialo y pegalo en el navegador.
- Para enviar emails de verdad completá `SMTP_*` y `MAIL_FROM` en `backend/.env` (con Gmail hace falta una "contraseña de aplicación").
- El link vale 60 minutos y se usa una sola vez. En la base solo se guarda su hash.

## Imágenes
Las fotos de productos y el logo se suben desde el panel y se guardan en `backend/uploads/` (una carpeta por tienda). Se validan por su contenido
(solo JPG, PNG y WebP reales, nunca SVG ni HTML), con nombre aleatorio y hasta 3 MB. Al reemplazar o eliminar una imagen, el archivo viejo se borra.
- La carpeta `uploads` **no va a GitHub** (ya está en `.gitignore`) y hay que incluirla en tus copias de seguridad.
- Si subís una imagen y salís sin guardar, el archivo queda en la carpeta sin usar (se puede borrar a mano).
- Al publicar la tienda en un servidor, esa carpeta tiene que estar en un disco que no se borre al reiniciar (o pasar a un servicio de almacenamiento en la nube).

## Migraciones
Cada cambio de la base es un archivo numerado en `database/migraciones/`. `npm run migrar` aplica los que faltan, en orden, y
anota cuáles ya se aplicaron (tabla `migraciones`). **Nunca edites un archivo ya aplicado**: creá uno nuevo (`004_..., 005_...sql`).

## Varias tiendas (más adelante)
Todas las tablas llevan `id_tienda`. El backend decide la tienda de cada pedido así:
- Si llega el header `X-Tienda: <slug>`, usa esa tienda (el frontend lo manda si definís `VITE_TIENDA` en `frontend/.env`).
- Si no, usa la tienda `TIENDA_ID` del `.env` (modo "una sola tienda", el actual).

Un token de sesión de una tienda no sirve en otra.

## Endpoints
| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| GET | `/tienda` | público | Nombre, color, contacto, medios de pago y envíos activos |
| GET | `/tienda/admin` | admin | Lo mismo, incluyendo lo desactivado |
| POST | `/pedidos/:id/pagar-mp` | cliente | Link de pago de Mercado Pago del pedido |
| POST | `/pedidos/:id/verificar-pago` | cliente | Consulta a Mercado Pago si el pedido ya se pagó |
| POST | `/pagos/webhook` | Mercado Pago | Aviso de pago (se valida la firma y se consulta el pago) |
| GET | `/pedidos/resumen` | admin | Vendido, por cobrar y pedidos por estado |
| PUT | `/tienda` | admin | Datos de la tienda (nombre, logo, contacto) |
| PUT | `/tienda/apariencia` | admin | Modelo de diseño, color, esquinas, grilla, aviso y portada |
| PUT | `/tienda/pagos` | admin | Medios de pago |
| POST/PUT/DELETE | `/tienda/envios`, `/tienda/envios/:id` | admin | Métodos de envío |
| GET | `/productos` | público | Catálogo (filtros: `categoria`, `q`, `pagina`, `limite`) |
| GET | `/productos/:id` | público | Un producto con sus variantes |
| GET | `/productos/admin/todos` | admin | Productos incluidos los ocultos |
| GET | `/productos/admin/:id` | admin | Un producto (visible u oculto) para editarlo |
| POST | `/uploads` | admin | Subir una imagen (el cuerpo es el archivo). Devuelve `{ url }` |
| POST/PUT/DELETE | `/productos`, `/productos/:id` | admin | Gestionar productos |
| POST | `/productos/:id/variantes` | admin | Agregar talle/color |
| PUT/DELETE | `/variantes/:id` | admin | Editar / borrar una variante |
| GET | `/categorias` | público | Categorías |
| GET | `/categorias/admin/todas` | admin | Categorías con cantidad de productos |
| POST | `/categorias` | admin | Crear categoría |
| PUT/DELETE | `/categorias/:id` | admin | Renombrar / eliminar |
| POST | `/auth/registro` | público | Crear cuenta de cliente |
| POST | `/auth/login` | público | Iniciar sesión (devuelve token) |
| POST | `/auth/olvide` | público | Pedir el link para cambiar la contraseña (siempre responde igual) |
| POST | `/auth/restablecer` | público | Cambiar la contraseña con el token del link |
| GET | `/auth/me` | sesión | Mis datos |
| POST | `/pedidos` | sesión | Comprar: `{ metodo_pago, id_envio, direccion_envio, items }` |
| GET | `/pedidos/mios` | sesión | Mis pedidos |
| GET | `/pedidos/:id` | dueño o admin | Un pedido |
| GET | `/pedidos` | admin | Todos los pedidos (`?estado=`) |
| PUT | `/pedidos/:id/estado` | admin | Cambiar estado / cancelar |

El token se manda en cada petición protegida: `Authorization: Bearer <token>`.
Para probar la API sin frontend usá `backend/pruebas.http` con la extensión *REST Client* de VS Code.

## Estructura
```
mitienda/
├── database/
│   ├── migraciones/      001_..., 002_..., 003_..., 004_... (cada cambio de la base)
│   └── datos_demo.sql    tienda de ejemplo
├── backend/
│   ├── .env.example
│   ├── pruebas.http
│   ├── scripts/          migrar, datos-demo, crear-admin
│   ├── uploads/          imágenes subidas (se crea sola)
│   └── src/
│       ├── app.js, config.js, db.js
│       ├── middleware/   tienda (resuelve la tienda), auth (token y roles), errores
│       ├── routes/       qué URL llama a qué función
│       ├── controllers/  la lógica de cada recurso
│       └── utils/        validaciones, email, límite de intentos
└── frontend/
    └── src/
        ├── context/      Tienda (config y color), Auth (sesión), Cart (carrito)
        ├── components/   Navbar, Footer, tarjetas
        └── pages/        catálogo, producto, carrito, checkout, mis pedidos, login... y admin/
```

## Pagos con Mercado Pago
1. Creá una aplicación en https://www.mercadopago.com.ar/developers y entrá a "Credenciales de prueba" y copiá el **Access Token** (puede empezar con `APP_USR-`: lo importante es que sea el de la pestaña de prueba, no el de producción).
2. En `backend/.env` agregá `MP_ACCESS_TOKEN=<el token>` y reiniciá el backend. Desde ese momento, "Mercado Pago" en el checkout lleva al cliente a pagar.
3. Para pagar de prueba usá una **cuenta de comprador de prueba** y las tarjetas de prueba que figuran en la documentación de Mercado Pago (nunca tu tarjeta real).
4. Cómo se confirma el pago, con dos caminos que se complementan:
   - Cuando el cliente vuelve a la tienda, esta le pregunta a Mercado Pago si el pago se acreditó (funciona también en tu computadora).
   - Mercado Pago avisa a `BACKEND_URL/pagos/webhook` (necesita una dirección pública https; en desarrollo, un túnel como ngrok). Opcional: `MP_WEBHOOK_SECRET` para comprobar la firma del aviso.
5. Seguridad: el servidor calcula el total, arma el link de pago y, antes de marcar "Pagado", vuelve a pedirle el pago a Mercado Pago y comprueba el número de pedido, la moneda y el monto. Un aviso falso no acredita nada, y un mismo pago no puede acreditar dos pedidos.
6. Si un pago llega para un pedido que ya estaba cancelado, el servidor lo avisa en la terminal: hay que devolver ese dinero desde Mercado Pago.
7. Para producción: credenciales reales, `FRONTEND_URL` y `BACKEND_URL` con https. En una plataforma con varias tiendas, cada una tendría su propia cuenta de Mercado Pago (hoy hay una sola, en el `.env`).

## Próximas etapas
- Subir el proyecto a GitHub con capturas (portfolio) y publicarlo.
- Un modelo por rubro cuando la base de indumentaria esté sólida.

## Agregar un modelo de diseño nuevo
1. En `frontend/src/temas.js`, copiá un bloque de `TEMAS` y cambiá sus valores (colores, tipografías de Google Fonts, forma de las fotos).
2. En `backend/src/utils/temas.js`, agregá el id a la lista `TEMAS` (el servidor solo acepta ids de esa lista).
