import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
config();

// Si falta una variable obligatoria, el servidor no arranca (mejor que usar una clave conocida)
const requerida = (nombre) => {
    const valor = process.env[nombre];
    if (!valor) throw new Error(`Falta ${nombre} en el archivo .env`);
    return valor;
};

export const PORT = Number(process.env.PORT) || 4100;
export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_PORT = Number(process.env.DB_PORT) || 3306;
export const DB_USER = process.env.DB_USER || 'root';
export const DB_PASSWORD = process.env.DB_PASSWORD || '';
export const DB_DATABASE = process.env.DB_DATABASE || 'mitienda';
export const TIENDA_ID = Number(process.env.TIENDA_ID) || 1;
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
export const JWT_SECRET = requerida('JWT_SECRET');

// ---- Recuperar contraseña ----
export const FRONTEND_URL = (process.env.FRONTEND_URL || CORS_ORIGIN).replace(/\/$/, '');
export const RESET_MINUTOS = 60; // el link para cambiar la contraseña vale 1 hora

// Correo (opcional). Si no se completa, el link se imprime en la terminal del backend.
export const SMTP_HOST = process.env.SMTP_HOST || '';
export const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASS = process.env.SMTP_PASS || '';
export const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER;

// ---- Imágenes subidas desde el panel (productos y logo) ----
export const UPLOADS_DIR = fileURLToPath(new URL('../uploads', import.meta.url)); // backend/uploads

// ---- Mercado Pago (opcional). Sin MP_ACCESS_TOKEN, "Mercado Pago" funciona como antes: el pedido queda pendiente y la tienda cobra por su cuenta ----
export const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
export const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || '';
// Dirección PÚBLICA (https) de esta API: Mercado Pago la usa para avisar que un pago se acreditó
export const BACKEND_URL = (process.env.BACKEND_URL || '').replace(/\/$/, '');
