// Conexión "de herramientas" (migraciones y datos de ejemplo). Permite varias instrucciones SQL por vez.
import { config } from 'dotenv';
import { createConnection } from 'mysql2/promise';

config();

export const DB_NAME = process.env.DB_DATABASE || 'mitienda';
if (!/^[A-Za-z0-9_]+$/.test(DB_NAME)) {
    console.error('❌ DB_DATABASE solo puede tener letras, números y guión bajo.');
    process.exit(1);
}

export const conectar = async ({ conBase = true } = {}) => {
    try {
        return await createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: conBase ? DB_NAME : undefined,
            multipleStatements: true,
        });
    } catch (err) {
        console.error(`❌ No se pudo conectar a MySQL: ${err.message}`);
        console.error('   ¿Está encendido MySQL en XAMPP? ¿Los datos de DB_* del .env son correctos?');
        process.exit(1);
    }
};
