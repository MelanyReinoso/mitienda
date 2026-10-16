// ---------- Precios ----------
const MONEDA = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
export const precio = (numero) => MONEDA.format(numero);

// ---------- Pedidos ----------
export const ESTADOS_PEDIDO = {
  pendiente: 'Pendiente de pago',
  pagado: 'Pagado',
  preparando: 'Preparando',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};
// A qué estados puede pasar cada pedido (el servidor vuelve a comprobarlo) y cómo se llama la acción
export const TRANSICIONES_PEDIDO = {
  pendiente: ['pagado', 'cancelado'],
  pagado: ['preparando', 'cancelado'],
  preparando: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: [],
};
export const ACCION_PEDIDO = {
  pagado: 'Marcar como pagado',
  preparando: 'Empezar a preparar',
  enviado: 'Marcar como enviado',
  entregado: 'Marcar como entregado',
  cancelado: 'Cancelar pedido',
};
export const NOMBRE_PAGO = { mercadopago: 'Mercado Pago', transferencia: 'Transferencia bancaria', tarjeta: 'Tarjeta de crédito o débito' };

const FECHA = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
export const fechaHora = (iso) => {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? '' : FECHA.format(fecha);
};

// ---------- Colores de las prendas ----------
// El nombre del color viene de la base ("Negro", "Azul"...); acá le damos un tono para pintarlo.
const COLORES = {
  negro: '#1d1f1e',
  blanco: '#f3f3ef',
  gris: '#9ba09d',
  azul: '#2e4a7d',
  celeste: '#8fb8de',
  rojo: '#b5342b',
  verde: '#3f7a54',
  'verde militar': '#55603f',
  beige: '#d8c7a8',
  crudo: '#e6dfd0',
  marron: '#6b4a35',
  rosa: '#e5a3b4',
  violeta: '#6e4f9c',
  amarillo: '#e5c04a',
  naranja: '#d9772b',
  bordo: '#6d1f2c',
};
const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Código de color solo si el nombre es conocido (sin inventar uno para nombres raros)
export const hexConocido = (nombre) => COLORES[normalizar(nombre || '')] || null;
export const NOMBRES_COLORES = Object.keys(COLORES).map((n) => n.charAt(0).toUpperCase() + n.slice(1));

// Si la variante trae su código de color (#rrggbb) se usa ese; si no, se busca por el nombre
export const colorHex = (nombre, hex) => hex || COLORES[normalizar(nombre)] || '#c9d0cb';

// Colores distintos de un producto, cada uno con su código: [{ color: 'Negro', hex: '#1d1f1e' }]
export const coloresDe = (variantes) => {
  const lista = [];
  for (const v of variantes) {
    const existente = lista.find((c) => c.color === v.color);
    if (!existente) lista.push({ color: v.color, hex: v.color_hex || null });
    else if (!existente.hex && v.color_hex) existente.hex = v.color_hex;
  }
  return lista;
};

// Devuelve blanco u oscuro, según cuál se lea mejor encima del color de fondo
export const textoSobre = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const luz = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return luz > 0.6 ? '#17231e' : '#ffffff';
};

// ---------- Contraste (para que el color que elija la tienda siempre se lea bien) ----------
const luminancia = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const canal = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(n >> 16) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
};
export const contraste = (a, b) => {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
};

// Texto (blanco u oscuro) que mejor se lee ENCIMA del color de la marca
export const textoSobreMarca = (hex) => (contraste(hex, '#ffffff') >= contraste(hex, '#17231e') ? '#ffffff' : '#17231e');

// Versión del color de la marca que se pueda leer como TEXTO sobre el fondo de la página.
// Si el fondo es claro, oscurece el color; si el fondo es oscuro, lo aclara.
export const marcaComoTexto = (hex, fondo = '#f7f7f3') => {
  const fondoOscuro = luminancia(fondo) < 0.2;
  const mover = (v) => (fondoOscuro ? Math.min(255, Math.round(v + (255 - v) * 0.15)) : Math.max(0, Math.round(v * 0.85)));
  let actual = hex;
  for (let i = 0; i < 20 && contraste(actual, fondo) < 4.5; i += 1) {
    const n = parseInt(actual.slice(1), 16);
    const r = mover(n >> 16);
    const g = mover((n >> 8) & 255);
    const b = mover(n & 255);
    actual = `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  }
  return actual;
};

// ---------- Talles ----------
const ORDEN_LETRAS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
export const ordenarTalles = (a, b) => {
  const ia = ORDEN_LETRAS.indexOf(String(a).toUpperCase());
  const ib = ORDEN_LETRAS.indexOf(String(b).toUpperCase());
  if (ia >= 0 && ib >= 0) return ia - ib;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return String(a).localeCompare(String(b), 'es');
};

// Evita redirecciones a otros sitios: solo aceptamos rutas internas ("/carrito"), nunca "//otro.com"
export const rutaInterna = (ruta) => (ruta && ruta.startsWith('/') && !ruta.startsWith('//') ? ruta : '/');

// Solo se manda al cliente a una dirección de Mercado Pago (nunca a lo que diga cualquier respuesta)
export const urlMercadoPago = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && /(^|\.)(mercadopago\.com(\.ar)?|mercadolibre\.com(\.ar)?)$/.test(u.hostname);
  } catch {
    return false;
  }
};
