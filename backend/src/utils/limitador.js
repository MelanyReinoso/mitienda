// Limita cuántas veces una misma IP puede llamar a una ruta en un período.
// Vive en la memoria del servidor (suficiente para una tienda chica; se reinicia con el servidor).
import { ErrorHttp } from '../middleware/errores.js';

export const limitar = ({ ventanaMs, max, mensaje }) => {
    const intentos = new Map(); // ip -> { cuenta, vence }

    return (req, res, next) => {
        const ahora = Date.now();
        const ip = req.ip;

        // Limpieza de registros vencidos para que el Map no crezca sin fin
        if (intentos.size > 1000) {
            for (const [clave, dato] of intentos) if (dato.vence <= ahora) intentos.delete(clave);
        }

        let dato = intentos.get(ip);
        if (!dato || dato.vence <= ahora) {
            dato = { cuenta: 0, vence: ahora + ventanaMs };
            intentos.set(ip, dato);
        }
        dato.cuenta += 1;

        if (dato.cuenta > max) {
            throw new ErrorHttp(429, mensaje || 'Demasiados intentos. Probá de nuevo en unos minutos.');
        }
        next();
    };
};
