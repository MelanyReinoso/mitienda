import db from '../db.js';
import { ErrorHttp } from '../middleware/errores.js';
import { invalidarTiendas } from '../middleware/tienda.js';
import { borrarImagenPropia } from '../utils/imagenes.js';
import { mpConfigurado } from '../utils/mercadopago.js';
import { TEMAS, ESQUINAS, GRILLAS, opcionDe } from '../utils/temas.js';
import { entero, texto, email as validarEmail, colorHex, urlSegura, porcentaje, dineroOCero } from '../utils/validar.js';

const CODIGOS_PAGO = ['mercadopago', 'transferencia', 'tarjeta'];

// ---------- Lectura ----------

const datosTienda = (t) => ({
    nombre: t.nombre,
    slug: t.slug,
    logo_url: t.logo_url,
    color_principal: t.color_principal,
    tema: t.tema,
    esquinas: t.esquinas,
    grilla: t.grilla,
    aviso: t.aviso,
    portada_titulo: t.portada_titulo,
    portada_texto: t.portada_texto,
    email_contacto: t.email_contacto,
    whatsapp: t.whatsapp,
    instagram: t.instagram,
    horario: t.horario,
});

// Lee la configuración de la tienda. El público solo ve lo que está activo; el admin ve todo.
const leerConfiguracion = async (idTienda, { incluirInactivos }) => {
    const [[tienda]] = await db.query('SELECT * FROM tiendas WHERE id_tienda = ?', [idTienda]);
    const filtro = incluirInactivos ? '' : 'AND activo = 1';

    const [pagos] = await db.query(
        `SELECT codigo, nombre, detalle, descuento_porcentaje, activo FROM medios_pago
          WHERE id_tienda = ? ${filtro} ORDER BY FIELD(codigo, 'mercadopago', 'tarjeta', 'transferencia')`,
        [idTienda]
    );
    const [envios] = await db.query(
        `SELECT id_envio, nombre, detalle, costo, requiere_direccion, activo FROM metodos_envio
          WHERE id_tienda = ? ${filtro} ORDER BY orden, id_envio`,
        [idTienda]
    );

    return {
        tienda: datosTienda(tienda),
        pagos_online: mpConfigurado(),
        medios_pago: pagos.map((p) => ({ ...p, descuento_porcentaje: Number(p.descuento_porcentaje), activo: Boolean(p.activo) })),
        metodos_envio: envios.map((e) => ({
            ...e,
            costo: Number(e.costo),
            requiere_direccion: Boolean(e.requiere_direccion),
            activo: Boolean(e.activo),
        })),
    };
};

// GET /tienda (público): lo que necesita el frontend para mostrarse (nombre, color, contacto, pagos y envíos)
export const obtenerPublica = async (req, res) => {
    res.json(await leerConfiguracion(req.tienda.id_tienda, { incluirInactivos: false }));
};

// GET /tienda/admin (admin): igual, pero incluye lo desactivado
export const obtenerAdmin = async (req, res) => {
    res.json(await leerConfiguracion(req.tienda.id_tienda, { incluirInactivos: true }));
};

// ---------- Validaciones ----------

const vacio = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

// Campo opcional: vacío → null; con contenido → tiene que pasar el validador
const opcional = (valor, validador, mensaje) => {
    if (vacio(valor)) return null;
    const limpio = validador(valor);
    if (limpio === null) throw new ErrorHttp(400, mensaje);
    return limpio;
};

const soloDigitos = (v) => {
    if (typeof v !== 'string') return null;
    const digitos = v.replace(/[\s+()-]/g, '');
    return /^\d{8,15}$/.test(digitos) ? digitos : null;
};

const usuarioInstagram = (v) => {
    if (typeof v !== 'string') return null;
    const limpio = v.trim().replace(/^@/, '');
    return /^[A-Za-z0-9._]{1,30}$/.test(limpio) ? limpio : null;
};

const esBooleano = (v) => typeof v === 'boolean';

// ---------- Datos de la tienda ----------

// PUT /tienda (admin)
export const actualizarTienda = async (req, res) => {
    const b = req.body || {};

    const nombre = texto(b.nombre, { min: 2, max: 100 });
    if (!nombre) throw new ErrorHttp(400, 'El nombre de la tienda es obligatorio (entre 2 y 100 caracteres).');

    const logo = opcional(b.logo_url, urlSegura, 'El logo tiene que ser un link que empiece con http:// o https://.');
    const emailContacto = opcional(b.email_contacto, validarEmail, 'El email de contacto no es válido.');
    const whatsapp = opcional(b.whatsapp, soloDigitos, 'El WhatsApp debe tener entre 8 y 15 números, con código de país (ej: 5491100000000).');
    const instagram = opcional(b.instagram, usuarioInstagram, 'El usuario de Instagram solo puede tener letras, números, puntos y guiones bajos.');
    const horario = opcional(b.horario, (v) => texto(v, { max: 120 }), 'El horario puede tener hasta 120 caracteres.');

    const [[previo]] = await db.query('SELECT logo_url FROM tiendas WHERE id_tienda = ?', [req.tienda.id_tienda]);

    await db.query(
        `UPDATE tiendas SET nombre = ?, logo_url = ?, email_contacto = ?,
                            whatsapp = ?, instagram = ?, horario = ?
          WHERE id_tienda = ?`,
        [nombre, logo, emailContacto, whatsapp, instagram, horario, req.tienda.id_tienda]
    );
    invalidarTiendas();
    if (previo?.logo_url && previo.logo_url !== logo) {
        // El logo anterior se borra del servidor, salvo que un producto todavía use esa misma imagen
        const [[{ usos }]] = await db.query('SELECT COUNT(*) AS usos FROM productos WHERE imagen_url = ?', [previo.logo_url]);
        if (Number(usos) === 0) await borrarImagenPropia(previo.logo_url, req.tienda.id_tienda);
    }
    res.json({ mensaje: 'Guardaste los datos de la tienda.', ...(await leerConfiguracion(req.tienda.id_tienda, { incluirInactivos: true })) });
};

// ---------- Apariencia ----------

// PUT /tienda/apariencia (admin)
//   { tema, color_principal, esquinas, grilla, aviso, portada_titulo, portada_texto }
// esquinas y grilla vacíos = "lo que define el modelo elegido".
export const actualizarApariencia = async (req, res) => {
    const b = req.body || {};

    const tema = opcionDe(b.tema, TEMAS);
    if (!tema) throw new ErrorHttp(400, 'Elegí uno de los modelos de diseño disponibles.');

    const color = colorHex(b.color_principal);
    if (!color) throw new ErrorHttp(400, 'El color debe tener el formato #rrggbb (por ejemplo #1d4b3a).');

    const esquinas = vacio(b.esquinas) ? null : opcionDe(b.esquinas, ESQUINAS);
    if (!vacio(b.esquinas) && !esquinas) throw new ErrorHttp(400, 'Las esquinas pueden ser rectas, suaves o redondas.');

    const grilla = vacio(b.grilla) ? null : opcionDe(b.grilla, GRILLAS);
    if (!vacio(b.grilla) && !grilla) throw new ErrorHttp(400, 'El tamaño de las tarjetas puede ser amplia, normal o compacta.');

    const aviso = opcional(b.aviso, (v) => texto(v, { max: 120 }), 'El aviso puede tener hasta 120 caracteres.');
    const portadaTitulo = opcional(b.portada_titulo, (v) => texto(v, { max: 80 }), 'El título de portada puede tener hasta 80 caracteres.');
    const portadaTexto = opcional(b.portada_texto, (v) => texto(v, { max: 200 }), 'El texto de portada puede tener hasta 200 caracteres.');

    await db.query(
        `UPDATE tiendas SET tema = ?, color_principal = ?, esquinas = ?, grilla = ?,
                            aviso = ?, portada_titulo = ?, portada_texto = ?
          WHERE id_tienda = ?`,
        [tema, color, esquinas, grilla, aviso, portadaTitulo, portadaTexto, req.tienda.id_tienda]
    );
    invalidarTiendas();
    res.json({ mensaje: 'Guardaste la apariencia de la tienda.', ...(await leerConfiguracion(req.tienda.id_tienda, { incluirInactivos: true })) });
};

// ---------- Medios de pago ----------

// PUT /tienda/pagos  { medios: [{ codigo, nombre, detalle, descuento_porcentaje, activo }] }
export const actualizarPagos = async (req, res) => {
    const medios = req.body?.medios;
    if (!Array.isArray(medios) || medios.length === 0 || medios.length > CODIGOS_PAGO.length) {
        throw new ErrorHttp(400, 'Datos de medios de pago inválidos.');
    }

    const limpios = [];
    for (const m of medios) {
        if (typeof m?.codigo !== 'string' || !CODIGOS_PAGO.includes(m.codigo) || limpios.some((l) => l.codigo === m.codigo)) {
            throw new ErrorHttp(400, 'Medio de pago inválido o repetido.');
        }
        const nombre = texto(m.nombre, { max: 60 });
        const descuento = porcentaje(m.descuento_porcentaje ?? 0);
        if (!nombre) throw new ErrorHttp(400, 'Cada medio de pago necesita un nombre (hasta 60 caracteres).');
        if (descuento === null) throw new ErrorHttp(400, 'El descuento tiene que estar entre 0 y 100.');
        if (!esBooleano(m.activo)) throw new ErrorHttp(400, 'Indicá si cada medio de pago está activo o no.');
        const detalle = opcional(m.detalle, (v) => texto(v, { max: 120 }), 'El detalle puede tener hasta 120 caracteres.');
        limpios.push({ codigo: m.codigo, nombre, detalle, descuento, activo: m.activo ? 1 : 0 });
    }

    const conexion = await db.getConnection();
    try {
        await conexion.beginTransaction();
        for (const m of limpios) {
            await conexion.query(
                `UPDATE medios_pago SET nombre = ?, detalle = ?, descuento_porcentaje = ?, activo = ?
                  WHERE id_tienda = ? AND codigo = ?`,
                [m.nombre, m.detalle, m.descuento, m.activo, req.tienda.id_tienda, m.codigo]
            );
        }
        const [[{ activos }]] = await conexion.query(
            'SELECT COUNT(*) AS activos FROM medios_pago WHERE id_tienda = ? AND activo = 1',
            [req.tienda.id_tienda]
        );
        if (Number(activos) === 0) throw new ErrorHttp(400, 'Tiene que quedar al menos un medio de pago activo.');
        await conexion.commit();
    } catch (err) {
        await conexion.rollback();
        throw err;
    } finally {
        conexion.release();
    }

    res.json({ mensaje: 'Guardaste los medios de pago.', ...(await leerConfiguracion(req.tienda.id_tienda, { incluirInactivos: true })) });
};

// ---------- Métodos de envío ----------

const leerEnvio = (b) => {
    const nombre = texto(b?.nombre, { max: 80 });
    if (!nombre) throw new ErrorHttp(400, 'El método de envío necesita un nombre (hasta 80 caracteres).');
    const costo = dineroOCero(b.costo ?? 0);
    if (costo === null) throw new ErrorHttp(400, 'El costo tiene que ser un número igual o mayor a 0.');
    if (!esBooleano(b.requiere_direccion) || !esBooleano(b.activo)) {
        throw new ErrorHttp(400, 'Indicá si pide dirección y si está activo.');
    }
    const detalle = opcional(b.detalle, (v) => texto(v, { max: 160 }), 'El detalle puede tener hasta 160 caracteres.');
    return { nombre, detalle, costo, requiere_direccion: b.requiere_direccion ? 1 : 0, activo: b.activo ? 1 : 0 };
};

const buscarEnvio = async (id, idTienda) => {
    const idValido = entero(id, { min: 1 });
    if (!idValido) throw new ErrorHttp(400, 'Id de envío inválido.');
    const [filas] = await db.query('SELECT id_envio, activo FROM metodos_envio WHERE id_envio = ? AND id_tienda = ?', [idValido, idTienda]);
    if (filas.length === 0) throw new ErrorHttp(404, 'El método de envío no existe.');
    return filas[0];
};

// Para que el checkout nunca se quede sin ninguna opción de envío
const exigirOtroActivo = async (idEnvio, idTienda) => {
    const [[{ otros }]] = await db.query(
        'SELECT COUNT(*) AS otros FROM metodos_envio WHERE id_tienda = ? AND activo = 1 AND id_envio <> ?',
        [idTienda, idEnvio]
    );
    if (Number(otros) === 0) throw new ErrorHttp(400, 'Tiene que quedar al menos un método de envío activo.');
};

// POST /tienda/envios
export const crearEnvio = async (req, res) => {
    const e = leerEnvio(req.body);
    const [[{ siguiente }]] = await db.query(
        'SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente FROM metodos_envio WHERE id_tienda = ?',
        [req.tienda.id_tienda]
    );
    const [r] = await db.query(
        `INSERT INTO metodos_envio (id_tienda, nombre, detalle, costo, requiere_direccion, activo, orden)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.tienda.id_tienda, e.nombre, e.detalle, e.costo, e.requiere_direccion, e.activo, siguiente]
    );
    res.status(201).json({ mensaje: 'Agregaste el método de envío.', id_envio: r.insertId });
};

// PUT /tienda/envios/:id
export const actualizarEnvio = async (req, res) => {
    const actual = await buscarEnvio(req.params.id, req.tienda.id_tienda);
    const e = leerEnvio(req.body);
    if (!e.activo && actual.activo) await exigirOtroActivo(actual.id_envio, req.tienda.id_tienda);

    await db.query(
        `UPDATE metodos_envio SET nombre = ?, detalle = ?, costo = ?, requiere_direccion = ?, activo = ?
          WHERE id_envio = ?`,
        [e.nombre, e.detalle, e.costo, e.requiere_direccion, e.activo, actual.id_envio]
    );
    res.json({ mensaje: 'Guardaste el método de envío.' });
};

// DELETE /tienda/envios/:id  (los pedidos viejos conservan el nombre y el costo que tenían)
export const eliminarEnvio = async (req, res) => {
    const actual = await buscarEnvio(req.params.id, req.tienda.id_tienda);
    if (actual.activo) await exigirOtroActivo(actual.id_envio, req.tienda.id_tienda);
    await db.query('DELETE FROM metodos_envio WHERE id_envio = ?', [actual.id_envio]);
    res.json({ mensaje: 'Eliminaste el método de envío.' });
};
