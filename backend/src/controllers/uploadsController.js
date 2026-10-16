import { ErrorHttp } from '../middleware/errores.js';
import { guardarImagen } from '../utils/imagenes.js';

// POST /uploads (admin). El cuerpo es la imagen tal cual (JPG, PNG o WebP, hasta 3 MB).
// Devuelve { url } para guardar en imagen_url del producto o en logo_url de la tienda.
export const subir = async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        throw new ErrorHttp(415, 'Subí una imagen en formato JPG, PNG o WebP.');
    }
    const url = await guardarImagen(req.body, req.tienda.id_tienda);
    if (!url) throw new ErrorHttp(415, 'El archivo no es una imagen JPG, PNG o WebP válida.');
    res.status(201).json({ url });
};
