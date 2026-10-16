import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } from '../config.js';

const correoConfigurado = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

// Evita que un nombre con símbolos rompa (o inyecte cosas en) el HTML del email
export const escaparHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Manda un email. Si no hay SMTP configurado (modo desarrollo), lo imprime en la terminal.
export async function enviarCorreo({ para, asunto, texto, html }) {
    if (!correoConfigurado) {
        console.log('\n📧 [Modo desarrollo: no hay SMTP configurado, el email NO se envió]');
        console.log(`   Para: ${para}\n   Asunto: ${asunto}\n`);
        console.log(texto.split('\n').map((l) => `   ${l}`).join('\n'));
        console.log('');
        return;
    }

    // Se carga solo si hace falta, así el backend arranca aunque no uses emails
    const { default: nodemailer } = await import('nodemailer');
    const transporte = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // 465 = SSL directo; 587 = STARTTLS
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporte.sendMail({ from: MAIL_FROM, to: para, subject: asunto, text: texto, html });
}
