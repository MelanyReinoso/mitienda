import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { JWT_SECRET, FRONTEND_URL, RESET_MINUTOS } from '../config.js';
import { ErrorHttp } from '../middleware/errores.js';
import { texto, email as validarEmail } from '../utils/validar.js';
import { enviarCorreo, escaparHtml } from '../utils/correo.js';

// Crea el token (dura 8 horas) con los datos mínimos
const firmarToken = (u) =>
    jwt.sign({ id: u.id_usuario, rol: u.rol, idTienda: u.id_tienda }, JWT_SECRET, { expiresIn: '8h' });

// Datos que se le muestran al front (NUNCA el hash de la contraseña)
const datosPublicos = (u) => ({
    id: u.id_usuario,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    telefono: u.telefono,
    rol: u.rol,
});

// POST /auth/registro  → siempre crea un CLIENTE (nadie puede registrarse como admin)
export const registro = async (req, res) => {
    const { nombre, apellido, email, password, telefono } = req.body || {};

    const datos = {
        nombre: texto(nombre, { max: 80 }),
        apellido: texto(apellido, { max: 80 }),
        email: validarEmail(email),
    };
    if (!datos.nombre || !datos.apellido || !datos.email) {
        throw new ErrorHttp(400, 'Nombre, apellido y un email válido son obligatorios.');
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
        throw new ErrorHttp(400, 'La contraseña debe tener entre 8 y 72 caracteres.');
    }

    const hash = await bcrypt.hash(password, 10);
    let resultado;
    try {
        [resultado] = await db.query(
            `INSERT INTO usuarios (id_tienda, nombre, apellido, email, telefono, password_hash, rol)
             VALUES (?, ?, ?, ?, ?, ?, 'cliente')`,
            [req.tienda.id_tienda, datos.nombre, datos.apellido, datos.email, texto(telefono, { max: 30 }), hash]
        );
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') throw new ErrorHttp(409, 'Ese email ya está registrado.');
        throw err;
    }

    const usuario = {
        id_usuario: resultado.insertId, id_tienda: req.tienda.id_tienda, rol: 'cliente',
        nombre: datos.nombre, apellido: datos.apellido, email: datos.email, telefono: texto(telefono, { max: 30 }),
    };
    res.status(201).json({ mensaje: 'Cuenta creada con éxito.', token: firmarToken(usuario), usuario: datosPublicos(usuario) });
};

// POST /auth/login
export const login = async (req, res) => {
    const { email, password } = req.body || {};
    const emailLimpio = validarEmail(email);
    if (!emailLimpio || typeof password !== 'string' || password === '') {
        throw new ErrorHttp(400, 'Ingresá tu email y tu contraseña.');
    }

    const [filas] = await db.query(
        'SELECT * FROM usuarios WHERE id_tienda = ? AND email = ?',
        [req.tienda.id_tienda, emailLimpio]
    );
    const usuario = filas[0];

    // Mismo mensaje si falla el email o la clave: así no damos pistas a un atacante
    const coincide = usuario ? await bcrypt.compare(password, usuario.password_hash) : false;
    if (!coincide) {
        throw new ErrorHttp(401, 'Email o contraseña incorrectos.');
    }

    res.json({ mensaje: '¡Bienvenido!', token: firmarToken(usuario), usuario: datosPublicos(usuario) });
};

// GET /auth/me → quién soy según mi token
export const yo = async (req, res) => {
    const [filas] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [req.usuario.id]);
    if (filas.length === 0) throw new ErrorHttp(401, 'La cuenta ya no existe.');
    res.json({ usuario: datosPublicos(filas[0]) });
};

// ---------------------------------------------------------------
// 🔑 Recuperar contraseña
// ---------------------------------------------------------------
const sha256 = (valor) => crypto.createHash('sha256').update(valor).digest('hex');

const MENSAJE_LINK_INVALIDO = 'El link no es válido o ya venció. Pedí uno nuevo desde "Olvidé mi contraseña".';

// POST /auth/olvide  { email }
// Responde SIEMPRE lo mismo, exista o no el email: así nadie puede averiguar quién tiene cuenta.
export const olvide = async (req, res) => {
    const emailLimpio = validarEmail(req.body?.email);
    if (!emailLimpio) throw new ErrorHttp(400, 'Ingresá un email válido.');

    const [filas] = await db.query(
        'SELECT id_usuario, nombre FROM usuarios WHERE id_tienda = ? AND email = ?',
        [req.tienda.id_tienda, emailLimpio]
    );
    const usuario = filas[0];

    if (usuario) {
        // El token se manda por email; en la base queda solo su hash
        const token = crypto.randomBytes(32).toString('hex');

        await db.query('DELETE FROM reset_tokens WHERE id_usuario = ?', [usuario.id_usuario]); // un solo link vigente
        await db.query(
            'INSERT INTO reset_tokens (id_usuario, token_hash, expira_en) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))',
            [usuario.id_usuario, sha256(token), RESET_MINUTOS]
        );

        const link = `${FRONTEND_URL}/restablecer?token=${token}`;
        const nombre = usuario.nombre;
        // Sin "await": la respuesta no espera al email (y no revela si el usuario existe por la demora)
        enviarCorreo({
            para: emailLimpio,
            asunto: `${req.tienda.nombre}: cambiá tu contraseña`,
            texto:
                `Hola ${nombre},\n\nPara crear una contraseña nueva entrá a este link (vale ${RESET_MINUTOS} minutos):\n${link}\n\n` +
                'Si no lo pediste vos, ignorá este mensaje: tu contraseña no cambia.',
            html:
                `<p>Hola ${escaparHtml(nombre)},</p>` +
                `<p>Para crear una contraseña nueva entrá a este link (vale ${RESET_MINUTOS} minutos):</p>` +
                `<p><a href="${link}">Crear contraseña nueva</a></p>` +
                '<p>Si no lo pediste vos, ignorá este mensaje: tu contraseña no cambia.</p>',
        }).catch((err) => console.error('❌ No se pudo enviar el email de recuperación:', err.message));
    }

    res.json({
        mensaje: 'Si ese email está registrado, te enviamos un link para crear una contraseña nueva. Revisá también la carpeta de spam.',
    });
};

// POST /auth/restablecer  { token, password }
export const restablecer = async (req, res) => {
    const { token, password } = req.body || {};

    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
        throw new ErrorHttp(400, MENSAJE_LINK_INVALIDO);
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
        throw new ErrorHttp(400, 'La contraseña debe tener entre 8 y 72 caracteres.');
    }

    const hash = await bcrypt.hash(password, 10);
    const conexion = await db.getConnection();
    try {
        await conexion.beginTransaction();

        // FOR UPDATE: si dos pestañas usan el mismo link a la vez, solo una gana
        const [filas] = await conexion.query(
            'SELECT id_usuario FROM reset_tokens WHERE token_hash = ? AND expira_en > NOW() FOR UPDATE',
            [sha256(token)]
        );
        if (filas.length === 0) throw new ErrorHttp(400, MENSAJE_LINK_INVALIDO);

        const idUsuario = filas[0].id_usuario;
        await conexion.query('UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?', [hash, idUsuario]);
        await conexion.query('DELETE FROM reset_tokens WHERE id_usuario = ?', [idUsuario]); // el link ya no sirve más

        await conexion.commit();
    } catch (err) {
        await conexion.rollback();
        throw err;
    } finally {
        conexion.release();
    }

    res.json({ mensaje: 'Listo, cambiaste tu contraseña. Ya podés ingresar.' });
};
