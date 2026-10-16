import db from '../db.js';
import { ErrorHttp } from '../middleware/errores.js';
import { entero, dinero, texto, colorHex, urlSegura } from '../utils/validar.js';
import { borrarImagenPropia } from '../utils/imagenes.js';

// ---------- Utilidades ----------

// MySQL devuelve los DECIMAL como texto ("42000.00"): los pasamos a número
const variantePublica = (v) => ({
    id_variante: v.id_variante,
    sku: v.sku,
    talle: v.talle,
    color: v.color,
    color_hex: v.color_hex,
    precio: Number(v.precio),
    stock: v.stock,
});

// Busca productos y les agrega sus variantes (2 consultas, sin repetir una por producto)
const cargarProductos = async ({ idTienda, soloActivos, categoria, busqueda, limite, pagina, idProducto }) => {
    let sql = `SELECT p.id_producto, p.nombre, p.descripcion, p.imagen_url, p.activo,
                      p.id_categoria, c.nombre AS categoria
               FROM productos p
               LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
               WHERE p.id_tienda = ?`;
    const params = [idTienda];

    if (soloActivos) sql += ' AND p.activo = 1';
    if (idProducto) { sql += ' AND p.id_producto = ?'; params.push(idProducto); }
    if (categoria) { sql += ' AND p.id_categoria = ?'; params.push(categoria); }
    if (busqueda) { sql += ' AND p.nombre LIKE ?'; params.push(`%${busqueda}%`); }

    sql += ' ORDER BY p.id_producto DESC LIMIT ? OFFSET ?';
    params.push(limite, (pagina - 1) * limite);

    const [productos] = await db.query(sql, params);
    if (productos.length === 0) return [];

    const [variantes] = await db.query(
        `SELECT id_variante, id_producto, sku, talle, color, color_hex, precio, stock
         FROM variantes WHERE id_producto IN (?) ORDER BY id_variante`,
        [productos.map((p) => p.id_producto)]
    );

    return productos.map((p) => {
        const suyas = variantes.filter((v) => v.id_producto === p.id_producto).map(variantePublica);
        return {
            ...p,
            activo: Boolean(p.activo),
            variantes: suyas,
            precio_desde: suyas.length ? Math.min(...suyas.map((v) => v.precio)) : null,
            stock_total: suyas.reduce((suma, v) => suma + v.stock, 0),
        };
    });
};

// Lee los filtros de la URL: /productos?categoria=2&q=remera&pagina=1
const leerFiltros = (query) => ({
    categoria: entero(query.categoria, { min: 1 }),
    busqueda: texto(query.q, { max: 100 }),
    limite: entero(query.limite, { min: 1, max: 100 }) ?? 24,
    pagina: entero(query.pagina, { min: 1 }) ?? 1,
});

// Valida una variante que llega del admin. Devuelve los datos limpios o lanza un error.
const validarVariante = (v) => {
    const precio = dinero(v?.precio);
    const stock = entero(v?.stock ?? 0, { min: 0, max: 100000 });
    const talle = texto(v?.talle ?? 'Único', { max: 20 });
    const color = texto(v?.color ?? 'Único', { max: 30 });
    const sku = v?.sku ? texto(v.sku, { max: 50 }) : null;
    const color_hex = v?.color_hex ? colorHex(v.color_hex) : null;   // opcional: #rrggbb

    if (precio === null) throw new ErrorHttp(400, 'Cada variante necesita un precio mayor a 0.');
    if (stock === null) throw new ErrorHttp(400, 'El stock debe ser un número entero de 0 o más.');
    if (!talle || !color) throw new ErrorHttp(400, 'Talle y color no pueden estar vacíos.');
    if (v?.color_hex && !color_hex) throw new ErrorHttp(400, 'El código de color debe tener el formato #rrggbb (por ejemplo #1d4b3a).');
    return { precio, stock, talle, color, color_hex, sku };
};

// Confirma que la categoría exista y sea de esta tienda (o devuelve null si no se envió)
const validarCategoria = async (idCategoria, idTienda) => {
    if (idCategoria === undefined || idCategoria === null || idCategoria === '') return null;
    const id = entero(idCategoria, { min: 1 });
    if (id === null) throw new ErrorHttp(400, 'La categoría no es válida.');
    const [filas] = await db.query('SELECT id_categoria FROM categorias WHERE id_categoria = ? AND id_tienda = ?', [id, idTienda]);
    if (filas.length === 0) throw new ErrorHttp(400, 'La categoría no existe.');
    return id;
};

// Imagen opcional: vacía → null; con contenido → tiene que ser un link http(s) o una imagen subida (/uploads/...)
const validarImagen = (valor) => {
    if (valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '')) return null;
    const url = urlSegura(valor);
    if (!url) throw new ErrorHttp(400, 'La imagen no es válida. Subí un archivo o pegá un link que empiece con http:// o https://.');
    return url;
};

// "activo" es opcional al editar: si no viene, se conserva lo que ya tenía
const leerActivo = (valor) => {
    if (valor === undefined) return null;
    if (typeof valor !== 'boolean') throw new ErrorHttp(400, 'El campo "activo" tiene que ser verdadero o falso.');
    return valor ? 1 : 0;
};

// Borra el archivo de una imagen subida, salvo que otro producto o el logo todavía la usen
const limpiarImagen = async (url, idTienda, exceptoProducto = 0) => {
    if (!url) return;
    const [[{ usos }]] = await db.query(
        `SELECT (SELECT COUNT(*) FROM productos WHERE imagen_url = ? AND id_producto <> ?)
              + (SELECT COUNT(*) FROM tiendas WHERE logo_url = ?) AS usos`,
        [url, exceptoProducto, url]
    );
    if (Number(usos) === 0) await borrarImagenPropia(url, idTienda);
};

// Intenta borrar y, si hay pedidos que lo usan, explica qué hacer en vez de mostrar un error técnico
const borrarConAviso = async (sql, params, mensajeSiEnUso) => {
    try {
        const [r] = await db.query(sql, params);
        return r.affectedRows > 0;
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') throw new ErrorHttp(409, mensajeSiEnUso);
        throw err;
    }
};

// ---------- Rutas públicas ----------

// GET /productos  → solo los activos
export const listar = async (req, res) => {
    const productos = await cargarProductos({ idTienda: req.tienda.id_tienda, soloActivos: true, ...leerFiltros(req.query) });
    res.json({ productos });
};

// GET /productos/:id
export const obtener = async (req, res) => {
    const id = entero(req.params.id, { min: 1 });
    const [producto] = id ? await cargarProductos({ idTienda: req.tienda.id_tienda, soloActivos: true, idProducto: id, limite: 1, pagina: 1 }) : [];
    if (!producto) throw new ErrorHttp(404, 'Producto no encontrado.');
    res.json({ producto });
};

// ---------- Rutas de administrador ----------

// GET /productos/admin/todos  → incluye los ocultos
export const listarAdmin = async (req, res) => {
    const productos = await cargarProductos({ idTienda: req.tienda.id_tienda, soloActivos: false, ...leerFiltros(req.query) });
    res.json({ productos });
};

// GET /productos/admin/:id  → un producto (visible u oculto) para editarlo
export const obtenerAdmin = async (req, res) => {
    const id = entero(req.params.id, { min: 1 });
    const [producto] = id ? await cargarProductos({ idTienda: req.tienda.id_tienda, soloActivos: false, idProducto: id, limite: 1, pagina: 1 }) : [];
    if (!producto) throw new ErrorHttp(404, 'Producto no encontrado.');
    res.json({ producto });
};

// POST /productos   { nombre, descripcion, imagen_url, id_categoria, activo, variantes: [{ talle, color, precio, stock, sku }] }
export const crear = async (req, res) => {
    const { descripcion, imagen_url, id_categoria, activo, variantes } = req.body || {};
    const nombre = texto(req.body?.nombre, { max: 150 });
    if (!nombre) throw new ErrorHttp(400, 'El nombre del producto es obligatorio.');
    if (!Array.isArray(variantes) || variantes.length === 0 || variantes.length > 100) {
        throw new ErrorHttp(400, 'El producto necesita al menos una variante (talle/color con precio y stock).');
    }

    const idCategoria = await validarCategoria(id_categoria, req.tienda.id_tienda);
    const imagen = validarImagen(imagen_url);
    const limpias = variantes.map(validarVariante);

    const conexion = await db.getConnection();
    try {
        await conexion.beginTransaction();

        const [r] = await conexion.query(
            `INSERT INTO productos (id_tienda, id_categoria, nombre, descripcion, imagen_url, activo)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.tienda.id_tienda, idCategoria, nombre, texto(descripcion, { max: 5000 }), imagen, leerActivo(activo) ?? 1]
        );
        for (const v of limpias) {
            await conexion.query(
                'INSERT INTO variantes (id_producto, sku, talle, color, color_hex, precio, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [r.insertId, v.sku, v.talle, v.color, v.color_hex, v.precio, v.stock]
            );
        }

        await conexion.commit();
        res.status(201).json({ mensaje: 'Producto creado.', id_producto: r.insertId });
    } catch (err) {
        await conexion.rollback();
        if (err.code === 'ER_DUP_ENTRY') throw new ErrorHttp(409, 'Hay dos variantes con el mismo talle y color.');
        throw err;
    } finally {
        conexion.release();
    }
};

// PUT /productos/:id   (datos del producto; las variantes se editan aparte)
export const actualizar = async (req, res) => {
    const id = entero(req.params.id, { min: 1 });
    const nombre = texto(req.body?.nombre, { max: 150 });
    if (!id) throw new ErrorHttp(404, 'Producto no encontrado.');
    if (!nombre) throw new ErrorHttp(400, 'El nombre del producto es obligatorio.');

    const idCategoria = await validarCategoria(req.body?.id_categoria, req.tienda.id_tienda);
    const imagen = validarImagen(req.body?.imagen_url);
    const activo = leerActivo(req.body?.activo);

    const [previo] = await db.query('SELECT imagen_url FROM productos WHERE id_producto = ? AND id_tienda = ?', [id, req.tienda.id_tienda]);
    if (previo.length === 0) throw new ErrorHttp(404, 'Producto no encontrado.');

    await db.query(
        `UPDATE productos SET nombre = ?, descripcion = ?, imagen_url = ?, id_categoria = ?, activo = COALESCE(?, activo)
         WHERE id_producto = ? AND id_tienda = ?`,
        [nombre, texto(req.body?.descripcion, { max: 5000 }), imagen, idCategoria, activo, id, req.tienda.id_tienda]
    );

    // Si cambió o quitó la imagen, la anterior (si era una subida) se borra del servidor
    if (previo[0].imagen_url && previo[0].imagen_url !== imagen) await limpiarImagen(previo[0].imagen_url, req.tienda.id_tienda, id);
    res.json({ mensaje: 'Producto actualizado.' });
};

// DELETE /productos/:id
export const eliminar = async (req, res) => {
    const id = entero(req.params.id, { min: 1 });
    const [previo] = id ? await db.query('SELECT imagen_url FROM productos WHERE id_producto = ? AND id_tienda = ?', [id, req.tienda.id_tienda]) : [[]];
    const borrado = id && await borrarConAviso(
        'DELETE FROM productos WHERE id_producto = ? AND id_tienda = ?',
        [id, req.tienda.id_tienda],
        'Este producto ya tiene pedidos y no se puede borrar. Ocultalo para que no se vea en la tienda.'
    );
    if (!borrado) throw new ErrorHttp(404, 'Producto no encontrado.');
    await limpiarImagen(previo[0]?.imagen_url, req.tienda.id_tienda);
    res.json({ mensaje: 'Producto eliminado.' });
};

// POST /productos/:id/variantes
export const crearVariante = async (req, res) => {
    const idProducto = entero(req.params.id, { min: 1 });
    const v = validarVariante(req.body);

    const [prod] = idProducto ? await db.query('SELECT id_producto FROM productos WHERE id_producto = ? AND id_tienda = ?', [idProducto, req.tienda.id_tienda]) : [[]];
    if (prod.length === 0) throw new ErrorHttp(404, 'Producto no encontrado.');

    try {
        const [r] = await db.query(
            'INSERT INTO variantes (id_producto, sku, talle, color, color_hex, precio, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [idProducto, v.sku, v.talle, v.color, v.color_hex, v.precio, v.stock]
        );
        res.status(201).json({ mensaje: 'Variante creada.', id_variante: r.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') throw new ErrorHttp(409, 'Ya existe una variante con ese talle y color.');
        throw err;
    }
};

// PUT /variantes/:id
export const actualizarVariante = async (req, res) => {
    const id = entero(req.params.id, { min: 1 });
    const v = validarVariante(req.body);
    try {
        const [r] = id ? await db.query(
            `UPDATE variantes va JOIN productos p ON p.id_producto = va.id_producto
             SET va.sku = ?, va.talle = ?, va.color = ?, va.color_hex = COALESCE(?, va.color_hex), va.precio = ?, va.stock = ?
             WHERE va.id_variante = ? AND p.id_tienda = ?`,
            [v.sku, v.talle, v.color, v.color_hex, v.precio, v.stock, id, req.tienda.id_tienda]
        ) : [{ affectedRows: 0 }];
        if (r.affectedRows === 0) throw new ErrorHttp(404, 'Variante no encontrada.');
        res.json({ mensaje: 'Variante actualizada.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') throw new ErrorHttp(409, 'Ya existe una variante con ese talle y color.');
        throw err;
    }
};

// DELETE /variantes/:id
export const eliminarVariante = async (req, res) => {
    const id = entero(req.params.id, { min: 1 });
    const borrado = id && await borrarConAviso(
        `DELETE va FROM variantes va JOIN productos p ON p.id_producto = va.id_producto
         WHERE va.id_variante = ? AND p.id_tienda = ?`,
        [id, req.tienda.id_tienda],
        'Esta variante ya fue vendida y no se puede borrar. Poné su stock en 0.'
    );
    if (!borrado) throw new ErrorHttp(404, 'Variante no encontrada.');
    res.json({ mensaje: 'Variante eliminada.' });
};
