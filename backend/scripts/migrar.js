// Uso:  npm run migrar
// Aplica, en orden, los archivos de database/migraciones/ que todavía no se aplicaron.
// Es seguro correrlo las veces que quieras: cada archivo se aplica UNA sola vez y no borra datos.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { conectar, DB_NAME } from './_conexion.js';

const carpeta = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'database', 'migraciones');

// Bases creadas ANTES de que existieran las migraciones: ya tienen estas tablas, así que
// registramos esa migración como aplicada en vez de intentar crearlas de nuevo.
const YA_EXISTENTES = { '001_esquema_inicial.sql': 'tiendas' };

const raiz = await conectar({ conBase: false });
await raiz.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await raiz.end();

const conexion = await conectar();
try {
    await conexion.query(`CREATE TABLE IF NOT EXISTS migraciones (
        nombre VARCHAR(100) PRIMARY KEY,
        aplicada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);

    const [aplicadas] = await conexion.query('SELECT nombre FROM migraciones');
    const hechas = new Set(aplicadas.map((f) => f.nombre));

    // Primera vez en una base que ya tenía las tablas
    if (hechas.size === 0) {
        for (const [archivo, tabla] of Object.entries(YA_EXISTENTES)) {
            const [existe] = await conexion.query('SHOW TABLES LIKE ?', [tabla]);
            if (existe.length > 0) {
                await conexion.query('INSERT INTO migraciones (nombre) VALUES (?)', [archivo]);
                hechas.add(archivo);
                console.log(`↩  ${archivo}: la base ya tenía esas tablas, se marca como aplicada.`);
            }
        }
    }

    const archivos = (await fs.readdir(carpeta)).filter((a) => a.endsWith('.sql')).sort();
    let nuevas = 0;
    for (const archivo of archivos) {
        if (hechas.has(archivo)) continue;
        const sql = await fs.readFile(path.join(carpeta, archivo), 'utf8');
        process.stdout.write(`▶  Aplicando ${archivo}... `);
        try {
            await conexion.query(sql);
        } catch (err) {
            console.log('falló.');
            console.error(`❌ ${err.message}`);
            console.error('   Se frenó acá. Los archivos siguientes NO se aplicaron.');
            process.exitCode = 1;
            break;
        }
        await conexion.query('INSERT INTO migraciones (nombre) VALUES (?)', [archivo]);
        console.log('listo.');
        nuevas += 1;
    }
    if (!process.exitCode) {
        console.log(nuevas ? `✅ Base "${DB_NAME}" actualizada (${nuevas} migración/es).` : `✅ Base "${DB_NAME}" al día, no había nada para aplicar.`);
    }
} finally {
    await conexion.end();
}
