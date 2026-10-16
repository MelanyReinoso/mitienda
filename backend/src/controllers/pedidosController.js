import db from '../db.js';
import { ErrorHttp } from '../middleware/errores.js';
import { entero, texto } from '../utils/validar.js';

// A qué estados se puede pasar desde cada estado
const TRANSICIONES = {
    pendiente: ['pagado', 'cancelado'],
    pagado: ['preparando', 'cancelado'],
    preparando: ['enviado', 'cancelado'],
    enviado: ['entregado'],
    entregado: [],
    cancelado: [],
};

const ESTADOS_COBRADOS = ['pagado', 'preparando', 'enviado', 'entregado'];

// Dinero en CENTAVOS (enteros) para no tener errores de redondeo con decimales
const aCentavos = (decimal) => Math.round(Number(decimal) * 100);
const aDecimal = (centavos) => (centavos / 100).toFixed(2);

const pedidoPublico = (p) => ({
    ...p,
    subtotal: Number(p.subtotal),
    descuento: Number(p.descuento),
    costo_envio: Number(p.costo_envio),
    total: Number(p.total),
});

// Agrega a cada pedido la lista de lo que se compró
const conDetalle = async (pedidos) => {
    if (pedidos.length === 0) return [];
    const [detalle] = await db.query(
        `SELECT id_pedido, id_variante, nombre_producto, talle, color, cantidad, precio_unitario
         FROM detalle_pedido WHERE id_pedido IN (?) ORDER BY id_detalle`,
        [pedidos.map((p) => p.id_pedido)]
    );
    return pedidos.map((p) => ({
        ...pedidoPublico(p),
        items: detalle
            .filter((d) => d.id_pedido === p.id_pedido)
            .map((d) => ({ ...d, precio_unitario: Number(d.precio_unitario) })),
    }));
};

// POST /pedidos   { metodo_pago, id_envio, direccion_envio, items: [{ id_variante, cantidad }] }
// El cliente sale del TOKEN. Los precios, el descuento, el costo de envío y el stock salen de la BASE.
// Del navegador solo viene "qué quiere comprar" y "cómo quiere pagar y recibirlo".
export const crear = async (req, res) => {
    const { metodo_pago, items } = req.body || {};
    const idEnvio = entero(req.body?.id_envio, { min: 1 });
    const idTienda = req.tienda.id_tienda;

    // Medio de pago: tiene que existir y estar activo en ESTA tienda; su descuento sale de la base
    const [medios] = typeof metodo_pago === 'string'
        ? await db.query('SELECT descuento_porcentaje FROM medios_pago WHERE id_tienda = ? AND codigo = ? AND activo = 1', [idTienda, metodo_pago])
        : [[]];
    if (medios.length === 0) throw new ErrorHttp(400, 'Método de pago inválido.');
    const porcentajeDescuento = Number(medios[0].descuento_porcentaje);

    // Método de envío: igual, y de ahí sale el costo
    const [envios] = idEnvio
        ? await db.query('SELECT id_envio, nombre, costo, requiere_direccion FROM metodos_envio WHERE id_envio = ? AND id_tienda = ? AND activo = 1', [idEnvio, idTienda])
        : [[]];
    if (envios.length === 0) throw new ErrorHttp(400, 'Elegí un método de envío válido.');
    const envio = envios[0];

    // Si el envío es a domicilio hace falta dirección; si es retiro en el local, no
    const direccion = envio.requiere_direccion
        ? texto(req.body?.direccion_envio, { min: 5, max: 255 })
        : envio.nombre;
    if (!direccion) throw new ErrorHttp(400, 'Ingresá la dirección de envío (mínimo 5 caracteres).');

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
        throw new ErrorHttp(400, 'El carrito está vacío o es inválido.');
    }

    // Juntamos las variantes repetidas y validamos las cantidades
    const pedido = new Map(); // id_variante -> cantidad
    for (const item of items) {
        const id = entero(item?.id_variante, { min: 1 });
        const cantidad = entero(item?.cantidad ?? 1, { min: 1, max: 99 });
        if (id === null || cantidad === null) {
            throw new ErrorHttp(400, 'Hay productos o cantidades inválidas en el carrito.');
        }
        pedido.set(id, (pedido.get(id) || 0) + cantidad);
    }

    const conexion = await db.getConnection();
    try {
        await conexion.beginTransaction();

        // 1. Leemos precio y stock REALES, bloqueando esas filas hasta terminar la compra
        const ids = [...pedido.keys()].sort((a, b) => a - b);
        const [filas] = await conexion.query(
            `SELECT va.id_variante, va.talle, va.color, va.precio, va.stock, p.nombre
             FROM variantes va JOIN productos p ON p.id_producto = va.id_producto
             WHERE va.id_variante IN (?) AND p.id_tienda = ? AND p.activo = 1
             ORDER BY va.id_variante FOR UPDATE`,
            [ids, req.tienda.id_tienda]
        );
        const enBase = new Map(filas.map((f) => [f.id_variante, f]));

        // 2. Validamos que existan y que alcance el stock; sumamos con los precios de la base
        let subtotal = 0;
        for (const [id, cantidad] of pedido) {
            const v = enBase.get(id);
            if (!v) throw new ErrorHttp(400, 'Uno de los productos ya no está disponible.');
            if (v.stock < cantidad) {
                throw new ErrorHttp(400, v.stock === 0
                    ? `"${v.nombre}" (${v.talle}, ${v.color}) está agotado.`
                    : `Stock insuficiente de "${v.nombre}" (${v.talle}, ${v.color}). Disponible: ${v.stock}.`);
            }
            subtotal += aCentavos(v.precio) * cantidad;
        }
        // El descuento se aplica sobre los productos; el envío se suma aparte
        const descuento = Math.round((subtotal * porcentajeDescuento) / 100);
        const costoEnvio = aCentavos(envio.costo);
        const total = subtotal - descuento + costoEnvio;

        // 3. Guardamos el pedido, su detalle y descontamos el stock
        const [r] = await conexion.query(
            `INSERT INTO pedidos (id_tienda, id_usuario, estado, metodo_pago, subtotal, descuento, costo_envio, total,
                                  direccion_envio, id_envio, envio_nombre)
             VALUES (?, ?, 'pendiente', ?, ?, ?, ?, ?, ?, ?, ?)`,
            [idTienda, req.usuario.id, metodo_pago, aDecimal(subtotal), aDecimal(descuento), aDecimal(costoEnvio),
             aDecimal(total), direccion, envio.id_envio, envio.nombre]
        );
        for (const [id, cantidad] of pedido) {
            const v = enBase.get(id);
            await conexion.query(
                `INSERT INTO detalle_pedido (id_pedido, id_variante, nombre_producto, talle, color, cantidad, precio_unitario)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [r.insertId, id, v.nombre, v.talle, v.color, cantidad, v.precio]
            );
            await conexion.query('UPDATE variantes SET stock = stock - ? WHERE id_variante = ?', [cantidad, id]);
        }

        await conexion.commit();
        res.status(201).json({
            mensaje: '¡Pedido realizado con éxito!',
            id_pedido: r.insertId,
            estado: 'pendiente',
            subtotal: subtotal / 100,
            descuento: descuento / 100,
            costo_envio: costoEnvio / 100,
            total: total / 100,
        });
    } catch (err) {
        await conexion.rollback(); // si algo falla, no se guarda nada a medias
        throw err;
    } finally {
        conexion.release();
    }
};

// GET /pedidos/mios  → mis pedidos
export const misPedidos = async (req, res) => {
    const [pedidos] = await db.query(
        'SELECT * FROM pedidos WHERE id_usuario = ? AND id_tienda = ? ORDER BY id_pedido DESC LIMIT 100',
        [req.usuario.id, req.tienda.id_tienda]
    );
    res.json({ pedidos: await conDetalle(pedidos) });
};

// GET /pedidos/:id  → el dueño del pedido o un admin
export const obtener = async (req, res) => {
    const id = entero(req.params.id, { min: 1 });
    const [filas] = id ? await db.query('SELECT * FROM pedidos WHERE id_pedido = ? AND id_tienda = ?', [id, req.tienda.id_tienda]) : [[]];
    const pedido = filas[0];

    // Si no es suyo respondemos "no encontrado" (así no revelamos que existe)
    if (!pedido || (req.usuario.rol !== 'admin' && pedido.id_usuario !== req.usuario.id)) {
        throw new ErrorHttp(404, 'Pedido no encontrado.');
    }
    const [conItems] = await conDetalle([pedido]);
    res.json({ pedido: conItems });
};

// GET /pedidos?estado=pendiente  → todos los pedidos (admin)
export const listarTodos = async (req, res) => {
    const estado = req.query.estado;
    if (estado !== undefined && !Object.hasOwn(TRANSICIONES, estado)) {
        throw new ErrorHttp(400, 'Estado inválido.');
    }

    let sql = `SELECT p.*, CONCAT(u.nombre, ' ', u.apellido) AS cliente, u.email AS cliente_email
               FROM pedidos p JOIN usuarios u ON u.id_usuario = p.id_usuario
               WHERE p.id_tienda = ?`;
    const params = [req.tienda.id_tienda];
    if (estado) { sql += ' AND p.estado = ?'; params.push(estado); }
    sql += ' ORDER BY p.id_pedido DESC LIMIT 200';

    const [pedidos] = await db.query(sql, params);
    res.json({ pedidos: await conDetalle(pedidos) });
};

// GET /pedidos/resumen  (admin)
// Cuánto se vendió y cuántos pedidos hay en cada estado. "Vendido" = pedidos ya pagados
// (pagado, preparando, enviado, entregado); los pendientes se muestran aparte como "por cobrar".
export const resumen = async (req, res) => {
    const [filas] = await db.query(
        `SELECT estado, COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS total,
                COALESCE(SUM(CASE WHEN creado_en >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN total ELSE 0 END), 0) AS total_30d
           FROM pedidos WHERE id_tienda = ? GROUP BY estado`,
        [req.tienda.id_tienda]
    );
    const por_estado = Object.fromEntries(Object.keys(TRANSICIONES).map((e) => [e, { cantidad: 0, total: 0 }]));
    let vendido = 0;
    let vendido30 = 0;
    for (const f of filas) {
        if (!Object.hasOwn(por_estado, f.estado)) continue;
        por_estado[f.estado] = { cantidad: Number(f.cantidad), total: Number(f.total) };
        if (ESTADOS_COBRADOS.includes(f.estado)) {
            vendido += aCentavos(f.total);
            vendido30 += aCentavos(f.total_30d);
        }
    }
    res.json({
        por_estado,
        vendido: vendido / 100,
        vendido_30_dias: vendido30 / 100,
        por_cobrar: por_estado.pendiente.total,
    });
};

// PUT /pedidos/:id/estado   { estado }  (admin)
// Si se cancela, el stock vuelve a las variantes.
export const cambiarEstado = async (req, res) => {
    const id = entero(req.params.id, { min: 1 });
    const nuevo = req.body?.estado;
    if (typeof nuevo !== 'string' || !Object.hasOwn(TRANSICIONES, nuevo)) {
        throw new ErrorHttp(400, 'Estado inválido.');
    }

    const conexion = await db.getConnection();
    try {
        await conexion.beginTransaction();

        const [filas] = id ? await conexion.query(
            'SELECT id_pedido, estado FROM pedidos WHERE id_pedido = ? AND id_tienda = ? FOR UPDATE',
            [id, req.tienda.id_tienda]
        ) : [[]];
        const pedido = filas[0];
        if (!pedido) throw new ErrorHttp(404, 'Pedido no encontrado.');

        if (!TRANSICIONES[pedido.estado].includes(nuevo)) {
            throw new ErrorHttp(400, `Un pedido "${pedido.estado}" no puede pasar a "${nuevo}".`);
        }

        if (nuevo === 'cancelado') {
            const [detalle] = await conexion.query('SELECT id_variante, cantidad FROM detalle_pedido WHERE id_pedido = ?', [id]);
            for (const d of detalle) {
                await conexion.query('UPDATE variantes SET stock = stock + ? WHERE id_variante = ?', [d.cantidad, d.id_variante]);
            }
        }

        await conexion.query('UPDATE pedidos SET estado = ? WHERE id_pedido = ?', [nuevo, id]);
        await conexion.commit();
        res.json({ mensaje: `Pedido actualizado a "${nuevo}".`, estado: nuevo });
    } catch (err) {
        await conexion.rollback();
        throw err;
    } finally {
        conexion.release();
    }
};
