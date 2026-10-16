// Comunicación con la API de Mercado Pago. El token vive SOLO en el servidor (archivo .env).
import crypto from 'node:crypto';
import { MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET } from '../config.js';
import { ErrorHttp } from '../middleware/errores.js';

const API = 'https://api.mercadopago.com';

export const mpConfigurado = () => MP_ACCESS_TOKEN !== '';

const llamar = async (ruta, { metodo = 'GET', cuerpo } = {}) => {
    let respuesta;
    try {
        respuesta = await fetch(API + ruta, {
            method: metodo,
            headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
            body: cuerpo ? JSON.stringify(cuerpo) : undefined,
            signal: AbortSignal.timeout(10_000),
        });
    } catch (err) {
        console.error('Mercado Pago no respondió:', err.message);
        throw new ErrorHttp(502, 'No pudimos comunicarnos con Mercado Pago. Probá de nuevo en un momento.');
    }
    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
        console.error(`Mercado Pago respondió ${respuesta.status}:`, JSON.stringify(datos));
        throw new ErrorHttp(502, 'Mercado Pago rechazó la operación. Probá de nuevo o elegí otro medio de pago.');
    }
    return datos;
};

// Crea el "link de pago" de un pedido. Devuelve la dirección a la que hay que mandar al cliente.
export const crearPreferencia = async (preferencia) => (await llamar('/checkout/preferences', { metodo: 'POST', cuerpo: preferencia })).init_point;

export const obtenerPago = (idPago) => llamar(`/v1/payments/${encodeURIComponent(idPago)}`);

// Pagos asociados a un pedido (external_reference = número de pedido), el más nuevo primero
export const pagosDelPedido = async (idPedido) =>
    (await llamar(`/v1/payments/search?external_reference=${encodeURIComponent(idPedido)}&sort=date_created&criteria=desc`)).results ?? [];

// Comprueba la firma (x-signature) con la que Mercado Pago firma sus avisos.
// Aunque no se compruebe, el aviso solo sirve como "disparador": el estado real del pago
// siempre se vuelve a pedir a Mercado Pago con nuestro token, así que no se puede falsificar un pago.
export const firmaValida = (req, idPago) => {
    if (!MP_WEBHOOK_SECRET) return true;
    const cabecera = req.get('x-signature') || '';
    const partes = Object.fromEntries(cabecera.split(',').map((p) => p.trim().split('=').map((x) => x.trim())));
    if (!partes.ts || !partes.v1) return false;
    const manifiesto = `id:${String(idPago).toLowerCase()};request-id:${req.get('x-request-id') || ''};ts:${partes.ts};`;
    const esperada = crypto.createHmac('sha256', MP_WEBHOOK_SECRET).update(manifiesto).digest('hex');
    const recibida = Buffer.from(partes.v1, 'utf8');
    const calculada = Buffer.from(esperada, 'utf8');
    return recibida.length === calculada.length && crypto.timingSafeEqual(recibida, calculada);
};
