import db from '../db.js';
import { ErrorHttp } from '../middleware/errores.js';
import { BACKEND_URL, FRONTEND_URL } from '../config.js';
import { entero } from '../utils/validar.js';
import { crearPreferencia, firmaValida, mpConfigurado, obtenerPago, pagosDelPedido } from '../utils/mercadopago.js';

const aCentavos = (decimal) => Math.round(Number(decimal) * 100);

// Marca un pedido como pagado a partir de un pago de Mercado Pago.
// Se puede llamar muchas veces con el mismo pago: solo la primera vez cambia algo.
// Devuelve el estado en el que quedó el pedido (o null si el pago no corresponde a ningún pedido).
export const aplicarPago = async (pago) => {
    const idPedido = entero(pago.external_reference, { min: 1 });
    if (!idPedido) return null;

    const conexion = await db.getConnection();
    try {
        await conexion.beginTransaction();
        const [filas] = await conexion.query('SELECT id_pedido, estado, total, metodo_pago FROM pedidos WHERE id_pedido = ? FOR UPDATE', [idPedido]);
        const pedido = filas[0];
        if (!pedido || pedido.metodo_pago !== 'mercadopago') {
            await conexion.rollback();
            return null;
        }

        if (pago.status === 'approved' && pedido.estado === 'pendiente') {
            // El monto y la moneda tienen que coincidir con lo que el SERVIDOR calculó para el pedido
            if (pago.currency_id !== 'ARS' || aCentavos(pago.transaction_amount) !== aCentavos(pedido.total)) {
                console.warn(`⚠ Pago ${pago.id} aprobado pero no coincide con el pedido #${idPedido}. No se acredita.`);
                await conexion.rollback();
                return pedido.estado;
            }
            await conexion.query("UPDATE pedidos SET estado = 'pagado', mp_payment_id = ? WHERE id_pedido = ?", [String(pago.id), idPedido]);
            await conexion.commit();
            return 'pagado';
        }

        if (pago.status === 'approved' && pedido.estado === 'cancelado') {
            console.warn(`⚠ Llegó un pago aprobado (${pago.id}) para el pedido #${idPedido}, que estaba cancelado. Devolvé el dinero desde Mercado Pago.`);
        }
        await conexion.commit();
        return pedido.estado;
    } catch (err) {
        await conexion.rollback();
        // Un mismo pago no puede acreditar dos pedidos (clave única)
        if (err.code === 'ER_DUP_ENTRY') return 'pendiente';
        throw err;
    } finally {
        conexion.release();
    }
};

// El pedido tiene que ser de esta tienda y de quien lo pide (o de un admin, si se permite)
const pedidoPropio = async (req, { permitirAdmin = false } = {}) => {
    const id = entero(req.params.id, { min: 1 });
    const [filas] = id ? await db.query('SELECT * FROM pedidos WHERE id_pedido = ? AND id_tienda = ?', [id, req.tienda.id_tienda]) : [[]];
    const pedido = filas[0];
    const esDueno = pedido && pedido.id_usuario === req.usuario.id;
    if (!pedido || !(esDueno || (permitirAdmin && req.usuario.rol === 'admin'))) throw new ErrorHttp(404, 'Pedido no encontrado.');
    return pedido;
};

// POST /pedidos/:id/pagar-mp  → { url }: el link de pago de Mercado Pago para ese pedido
export const pagarConMercadoPago = async (req, res) => {
    if (!mpConfigurado()) {
        throw new ErrorHttp(503, 'El pago online todavía no está habilitado. La tienda se comunica con vos para coordinar el pago.');
    }
    const pedido = await pedidoPropio(req);
    if (pedido.metodo_pago !== 'mercadopago') throw new ErrorHttp(400, 'Este pedido no se paga con Mercado Pago.');
    if (pedido.estado !== 'pendiente') throw new ErrorHttp(400, 'Este pedido ya no está pendiente de pago.');

    const [[usuario]] = await db.query('SELECT email FROM usuarios WHERE id_usuario = ?', [req.usuario.id]);
    const volver = (resultado) => `${FRONTEND_URL}/pedido/${pedido.id_pedido}?pago=${resultado}`;

    const preferencia = {
        // Un solo renglón con el total que calculó el servidor (incluye descuento y envío)
        items: [{
            id: `pedido-${pedido.id_pedido}`,
            title: `Pedido #${pedido.id_pedido} - ${req.tienda.nombre}`.slice(0, 250),
            quantity: 1,
            unit_price: aCentavos(pedido.total) / 100,
            currency_id: 'ARS',
        }],
        external_reference: String(pedido.id_pedido),
        payer: usuario ? { email: usuario.email } : undefined,
        back_urls: { success: volver('ok'), pending: volver('pendiente'), failure: volver('error') },
        statement_descriptor: req.tienda.nombre.slice(0, 22),
    };
    // Mercado Pago solo acepta estas dos opciones con direcciones https
    if (FRONTEND_URL.startsWith('https://')) preferencia.auto_return = 'approved';
    if (BACKEND_URL.startsWith('https://')) preferencia.notification_url = `${BACKEND_URL}/pagos/webhook`;

    res.json({ url: await crearPreferencia(preferencia) });
};

// POST /pedidos/:id/verificar-pago  → { estado }
// Pregunta a Mercado Pago si el pedido ya tiene un pago aprobado. Lo usa el frontend cuando el cliente
// vuelve de pagar (y sirve aunque el aviso automático no llegue, por ejemplo en tu computadora).
export const verificarPago = async (req, res) => {
    const pedido = await pedidoPropio(req, { permitirAdmin: true });
    if (!mpConfigurado() || pedido.metodo_pago !== 'mercadopago' || pedido.estado !== 'pendiente') {
        return res.json({ estado: pedido.estado });
    }
    const aprobado = (await pagosDelPedido(pedido.id_pedido)).find((p) => p.status === 'approved');
    res.json({ estado: aprobado ? await aplicarPago(aprobado) ?? pedido.estado : pedido.estado });
};

// POST /pagos/webhook  (lo llama Mercado Pago, sin sesión)
export const webhook = async (req, res) => {
    const tipo = req.query.type || req.query.topic || req.body?.type;
    const idPago = String(req.query['data.id'] || req.query.id || req.body?.data?.id || '');
    if (tipo !== 'payment' || !/^\d{1,20}$/.test(idPago)) return res.sendStatus(200); // otros avisos no nos interesan
    if (!mpConfigurado()) return res.sendStatus(200);
    if (!firmaValida(req, idPago)) return res.sendStatus(401);

    // Si falla (error 500), Mercado Pago reintenta más tarde
    await aplicarPago(await obtenerPago(idPago));
    res.sendStatus(200);
};
