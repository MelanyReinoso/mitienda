// Uso:  npm run crear-admin
// Crea (o actualiza) el usuario administrador, guardando la contraseña hasheada.
import readline from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import db from '../src/db.js';
import { TIENDA_ID } from '../src/config.js';
import { email as validarEmail } from '../src/utils/validar.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

try {
    const [tienda] = await db.query('SELECT id_tienda FROM tiendas WHERE id_tienda = ?', [TIENDA_ID]);
    if (tienda.length === 0) {
        console.log(`❌ No existe la tienda ${TIENDA_ID}. Corré primero:  npm run migrar  y después  npm run datos-demo`);
        process.exit(1);
    }

    const nombre = (await rl.question('Nombre: ')).trim() || 'Admin';
    const apellido = (await rl.question('Apellido: ')).trim() || 'Tienda';
    const email = validarEmail(await rl.question('Email: '));
    const password = await rl.question('Contraseña (mínimo 8 caracteres, se verá mientras escribís): ');

    if (!email) { console.log('❌ El email no es válido.'); process.exit(1); }
    if (password.length < 8 || password.length > 72) { console.log('❌ La contraseña debe tener entre 8 y 72 caracteres.'); process.exit(1); }

    const hash = await bcrypt.hash(password, 10);
    await db.query(
        `INSERT INTO usuarios (id_tienda, nombre, apellido, email, password_hash, rol)
         VALUES (?, ?, ?, ?, ?, 'admin')
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), apellido = VALUES(apellido),
                                 password_hash = VALUES(password_hash), rol = 'admin'`,
        [TIENDA_ID, nombre, apellido, email, hash]
    );
    console.log(`✔ Administrador listo: ${email}`);
} finally {
    rl.close();
    await db.end();
}
