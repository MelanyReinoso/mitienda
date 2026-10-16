import { createPool } from 'mysql2/promise';
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE } from './config.js';

export const db = createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    connectionLimit: 10,
});

// Probamos la conexión al iniciar para enterarnos enseguida si algo está mal
db.getConnection()
    .then((conexion) => {
        console.log(`✅ Conectado a MySQL: ${DB_DATABASE}`);
        conexion.release();
    })
    .catch((err) => console.error('❌ No se pudo conectar a MySQL:', err.message));

export default db;
