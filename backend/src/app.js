import express from 'express';
import cors from 'cors';
import { PORT, CORS_ORIGIN, UPLOADS_DIR } from './config.js';
import './db.js';
import { rutaNoEncontrada, manejarErrores } from './middleware/errores.js';
import { resolverTienda } from './middleware/tienda.js';

import tiendaRoutes from './routes/tiendaRoutes.js';
import authRoutes from './routes/authRoutes.js';
import categoriasRoutes from './routes/categoriasRoutes.js';
import productosRoutes from './routes/productosRoutes.js';
import variantesRoutes from './routes/variantesRoutes.js';
import pedidosRoutes from './routes/pedidosRoutes.js';
import pagosRoutes from './routes/pagosRoutes.js';
import uploadsRoutes from './routes/uploadsRoutes.js';

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));   // solo tu frontend puede llamar a la API desde el navegador
app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => res.json({ ok: true, mensaje: 'API de Mi Tienda funcionando' }));

// Las imágenes subidas se sirven como archivos estáticos (sin pasar por la base). Los nombres son aleatorios.
app.use('/uploads', express.static(UPLOADS_DIR, {
    index: false,
    dotfiles: 'ignore',
    maxAge: '30d',
    immutable: true,
    setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // el frontend (otro puerto) tiene que poder mostrarlas
    },
}));

app.use(resolverTienda); // desde acá, req.tienda dice de qué tienda es cada pedido

app.use('/tienda', tiendaRoutes);
app.use('/auth', authRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/productos', productosRoutes);
app.use('/variantes', variantesRoutes);
app.use('/pedidos', pedidosRoutes);
app.use('/pagos', pagosRoutes);        // aviso de Mercado Pago
app.use('/uploads', uploadsRoutes); // POST: subir una imagen (admin)

app.use(rutaNoEncontrada);
app.use(manejarErrores);

app.listen(PORT, () => console.log(`🚀 API corriendo en http://localhost:${PORT}`));
