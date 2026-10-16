// Validaciones simples. Cada función devuelve el valor ya limpio, o null si no es válido.

// Entero (acepta "5" o 5). Ej: entero(req.body.cantidad, { min: 1, max: 99 })
export const entero = (valor, { min = -Infinity, max = Infinity } = {}) => {
    if (typeof valor === 'string') {
        if (valor.trim() === '') return null;
        valor = Number(valor);
    }
    return Number.isInteger(valor) && valor >= min && valor <= max ? valor : null;
};

// Dinero mayor a 0, redondeado a 2 decimales
export const dinero = (valor) => {
    if (typeof valor === 'string') {
        if (valor.trim() === '') return null;
        valor = Number(valor);
    }
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0 || valor > 99999999) return null;
    return Math.round(valor * 100) / 100;
};

// Texto con largo mínimo y máximo (devuelve el texto sin espacios de más)
export const texto = (valor, { min = 1, max = 255 } = {}) => {
    if (typeof valor !== 'string') return null;
    const limpio = valor.trim();
    return limpio.length >= min && limpio.length <= max ? limpio : null;
};

export const email = (valor) => {
    const limpio = texto(valor, { min: 5, max: 120 });
    return limpio && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio) ? limpio.toLowerCase() : null;
};

// Dinero que puede ser 0 (por ejemplo, envío gratis), con 2 decimales como máximo
export const dineroOCero = (valor) => {
    if (typeof valor === 'string') {
        if (valor.trim() === '') return null;
        valor = Number(valor);
    }
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0 || valor > 99999999) return null;
    return Math.round(valor * 100) / 100;
};

// Porcentaje de 0 a 100
export const porcentaje = (valor) => {
    if (typeof valor === 'string') {
        if (valor.trim() === '') return null;
        valor = Number(valor);
    }
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0 || valor > 100) return null;
    return Math.round(valor * 100) / 100;
};

// Color en formato #rrggbb (devuelve en minúsculas)
export const colorHex = (valor) =>
    typeof valor === 'string' && /^#[0-9a-fA-F]{6}$/.test(valor.trim()) ? valor.trim().toLowerCase() : null;

// Solo links http(s) o rutas internas: evita cosas como "javascript:..." en una imagen o logo
export const urlSegura = (valor) => {
    const limpio = texto(valor, { max: 255 });
    return limpio && (/^https?:\/\/\S+$/i.test(limpio) || /^\/[^\s/]\S*$/.test(limpio)) ? limpio : null;
};
