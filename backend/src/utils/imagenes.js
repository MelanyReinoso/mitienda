// Guardado seguro de imágenes subidas desde el panel.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { UPLOADS_DIR } from '../config.js';

// Averigua qué es el archivo MIRANDO SUS PRIMEROS BYTES. No confiamos en el nombre ni en lo que diga el navegador:
// así nadie puede subir un .html o .svg disfrazado de imagen.
export const detectarExtension = (b) => {
    if (b.length < 12) return null;
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
    if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
    if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
    return null;
};

// Guarda la imagen con un nombre aleatorio, en la carpeta de la tienda. Devuelve la ruta pública ("/uploads/t1/ab12.jpg") o null si no es una imagen válida.
export const guardarImagen = async (buffer, idTienda) => {
    const extension = detectarExtension(buffer);
    if (!extension) return null;

    const carpeta = path.join(UPLOADS_DIR, `t${idTienda}`);
    await fs.mkdir(carpeta, { recursive: true });
    const nombre = `${crypto.randomBytes(16).toString('hex')}.${extension}`;
    await fs.writeFile(path.join(carpeta, nombre), buffer, { flag: 'wx' });
    return `/uploads/t${idTienda}/${nombre}`;
};

// Solo reconocemos como "nuestras" las rutas con el formato exacto que genera guardarImagen
const PATRON = /^\/uploads\/t(\d+)\/([a-f0-9]{32}\.(?:jpg|png|webp))$/;

// Borra el archivo si es una imagen subida a ESTA tienda. Nunca falla: si no se puede borrar, no pasa nada grave.
export const borrarImagenPropia = async (url, idTienda) => {
    const partes = typeof url === 'string' ? PATRON.exec(url) : null;
    if (!partes || Number(partes[1]) !== idTienda) return;
    try {
        await fs.unlink(path.join(UPLOADS_DIR, `t${partes[1]}`, partes[2]));
    } catch {
        // ya no estaba: perfecto
    }
};
