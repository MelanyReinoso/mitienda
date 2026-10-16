import db from '../db.js';
import { TIENDA_ID } from '../config.js';
import { ErrorHttp } from './errores.js';

// 🏬 ¿De qué tienda es este pedido?
//  - Si el navegador manda el header  X-Tienda: mi-tienda  → se usa esa tienda (así funciona una plataforma con varias).
//  - Si no lo manda → se usa la tienda TIENDA_ID del .env (modo "una sola tienda").
// El resultado queda en req.tienda y TODAS las consultas lo usan para no mezclar datos entre tiendas.

const VIDA_CACHE_MS = 30_000; // la tienda casi no cambia: evitamos consultarla en cada pedido
const cache = new Map();      // clave -> { tienda, vence }

// Se llama cuando el admin cambia la configuración, para que se vea al instante
export const invalidarTiendas = () => cache.clear();

const buscar = async (clave, sql, valor) => {
    const guardada = cache.get(clave);
    if (guardada && guardada.vence > Date.now()) return guardada.tienda;

    const [filas] = await db.query(sql, [valor]);
    const tienda = filas[0] || null;
    if (tienda) cache.set(clave, { tienda, vence: Date.now() + VIDA_CACHE_MS });
    return tienda;
};

export const resolverTienda = async (req, res, next) => {
    const cabecera = req.headers['x-tienda'];
    const slug = typeof cabecera === 'string' ? cabecera.trim().toLowerCase() : '';

    if (slug) {
        if (!/^[a-z0-9-]{1,60}$/.test(slug)) throw new ErrorHttp(400, 'Tienda inválida.');
        req.tienda = await buscar(`slug:${slug}`, 'SELECT * FROM tiendas WHERE slug = ?', slug);
        if (!req.tienda) throw new ErrorHttp(404, 'La tienda no existe.');
    } else {
        req.tienda = await buscar(`id:${TIENDA_ID}`, 'SELECT * FROM tiendas WHERE id_tienda = ?', TIENDA_ID);
        if (!req.tienda) {
            throw new ErrorHttp(503, `No hay una tienda con id ${TIENDA_ID}. Corré "npm run datos-demo" o revisá TIENDA_ID en el .env.`);
        }
    }
    next();
};
