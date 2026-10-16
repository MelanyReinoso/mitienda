import db from '../db.js';
import { ErrorHttp } from '../middleware/errores.js';
import { entero, texto } from '../utils/validar.js';

// GET /categorias (público)
export const listar = async (req, res) => {
    const [categorias] = await db.query(
        'SELECT id_categoria, nombre FROM categorias WHERE id_tienda = ? ORDER BY nombre',
        [req.tienda.id_tienda]
    );
    res.json({ categorias });
};

// GET /categorias/admin/todas (admin): incluye cuántos productos tiene cada una
export const listarAdmin = async (req, res) => {
    const [filas] = await db.query(
        `SELECT c.id_categoria, c.nombre, COUNT(p.id_producto) AS cantidad_productos
           FROM categorias c
           LEFT JOIN productos p ON p.id_categoria = c.id_categoria
          WHERE c.id_tienda = ?
          GROUP BY c.id_categoria, c.nombre
          ORDER BY c.nombre`,
        [req.tienda.id_tienda]
    );
    const categorias = filas.map((f) => ({ ...f, cantidad_productos: Number(f.cantidad_productos) }));
    res.json({ categorias });
};

const nombreDuplicado = () => new ErrorHttp(409, 'Ya existe una categoría con ese nombre.');

// POST /categorias (admin)
export const crear = async (req, res) => {
    const nombre = texto(req.body?.nombre, { max: 80 });
    if (!nombre) throw new ErrorHttp(400, 'El nombre de la categoría es obligatorio (hasta 80 caracteres).');

    try {
        const [r] = await db.query('INSERT INTO categorias (id_tienda, nombre) VALUES (?, ?)', [req.tienda.id_tienda, nombre]);
        res.status(201).json({ id_categoria: r.insertId, nombre });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') throw nombreDuplicado();
        throw err;
    }
};

// Busca la categoría SOLO dentro de la tienda del admin (no se puede tocar la de otra tienda)
const buscarCategoria = async (id, idTienda) => {
    const idValido = entero(id, { min: 1 });
    if (!idValido) throw new ErrorHttp(400, 'Id de categoría inválido.');
    const [filas] = await db.query(
        'SELECT id_categoria, nombre FROM categorias WHERE id_categoria = ? AND id_tienda = ?',
        [idValido, idTienda]
    );
    if (filas.length === 0) throw new ErrorHttp(404, 'La categoría no existe.');
    return filas[0];
};

// PUT /categorias/:id (admin) → cambiar el nombre
export const actualizar = async (req, res) => {
    const categoria = await buscarCategoria(req.params.id, req.tienda.id_tienda);
    const nombre = texto(req.body?.nombre, { max: 80 });
    if (!nombre) throw new ErrorHttp(400, 'El nombre de la categoría es obligatorio (hasta 80 caracteres).');

    try {
        await db.query('UPDATE categorias SET nombre = ? WHERE id_categoria = ?', [nombre, categoria.id_categoria]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') throw nombreDuplicado();
        throw err;
    }
    res.json({ mensaje: 'Categoría actualizada.', id_categoria: categoria.id_categoria, nombre });
};

// DELETE /categorias/:id (admin). Los productos NO se borran: quedan "sin categoría" (ON DELETE SET NULL)
export const eliminar = async (req, res) => {
    const categoria = await buscarCategoria(req.params.id, req.tienda.id_tienda);
    const [[{ cantidad }]] = await db.query(
        'SELECT COUNT(*) AS cantidad FROM productos WHERE id_categoria = ?',
        [categoria.id_categoria]
    );
    await db.query('DELETE FROM categorias WHERE id_categoria = ?', [categoria.id_categoria]);
    res.json({ mensaje: 'Categoría eliminada.', productos_sin_categoria: Number(cantidad) });
};
