// Uso:  npm run datos-demo
// Carga la tienda de ejemplo (productos, categorías, medios de pago y envíos).
// Solo funciona si la base todavía no tiene ninguna tienda: nunca pisa datos reales.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { conectar } from './_conexion.js';

const archivo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'database', 'datos_demo.sql');

const conexion = await conectar();
try {
    let existentes;
    try {
        [existentes] = await conexion.query('SELECT COUNT(*) AS n FROM tiendas');
    } catch {
        console.error('❌ Todavía no existen las tablas. Primero corré:  npm run migrar');
        process.exit(1);
    }
    if (existentes[0].n > 0) {
        console.log('ℹ️  La base ya tiene una tienda cargada: no se agregan datos de ejemplo.');
    } else {
        await conexion.query(await fs.readFile(archivo, 'utf8'));
        console.log('✅ Datos de ejemplo cargados. Siguiente paso:  npm run crear-admin');
    }
} finally {
    await conexion.end();
}
