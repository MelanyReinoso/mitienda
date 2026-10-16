// Opciones de apariencia permitidas. Tienen que coincidir con frontend/src/temas.js.
export const TEMAS = ['clasico', 'minimal', 'urbano', 'boutique', 'fresco'];
export const ESQUINAS = ['rectas', 'suaves', 'redondas'];
export const GRILLAS = ['amplia', 'normal', 'compacta'];

// Devuelve el valor si es una de las opciones permitidas; si no, null
export const opcionDe = (valor, lista) => (typeof valor === 'string' && lista.includes(valor) ? valor : null);
