import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import { ErrorHttp } from './errores.js';

// 🔐 Exige un token válido. El front lo manda así:  Authorization: Bearer <token>
export const verificarToken = (req, res, next) => {
    const [tipo, token] = (req.headers.authorization || '').split(' ');
    if (tipo !== 'Bearer' || !token) {
        throw new ErrorHttp(401, 'Necesitás iniciar sesión.');
    }
    try {
        req.usuario = jwt.verify(token, JWT_SECRET); // { id, rol, idTienda }
    } catch (err) {
        throw new ErrorHttp(401, 'Sesión inválida o vencida. Volvé a iniciar sesión.');
    }
    // Un token de una tienda no sirve en otra
    if (req.tienda && req.usuario.idTienda !== req.tienda.id_tienda) {
        throw new ErrorHttp(401, 'Esta sesión pertenece a otra tienda. Volvé a iniciar sesión.');
    }
    next();
};

// 👑 Solo administradores (se usa DESPUÉS de verificarToken).
// El rol sale del token firmado por el servidor, no de algo que el navegador pueda inventar.
export const soloAdmin = (req, res, next) => {
    if (req.usuario?.rol !== 'admin') {
        throw new ErrorHttp(403, 'Acceso denegado. Se requieren permisos de administrador.');
    }
    next();
};
