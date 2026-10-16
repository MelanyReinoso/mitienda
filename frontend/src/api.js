// Todas las llamadas al backend pasan por acá. Se encarga de: la URL base, mandar el token de sesión
// y traducir los errores a mensajes claros.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4100';
// Solo si el backend atiende varias tiendas: el slug de ESTA tienda (ver .env.example)
const TIENDA = import.meta.env.VITE_TIENDA || '';

let tokenEnMemoria = null; // por si el navegador bloquea localStorage

export const guardarToken = (token) => {
  tokenEnMemoria = token;
  try {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  } catch {
    // sin localStorage: la sesión dura hasta recargar la página
  }
};

const leerToken = () => {
  if (tokenEnMemoria) return tokenEnMemoria;
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado; // código HTTP (0 = no hubo conexión)
  }
}

// Las imágenes subidas desde el panel se guardan como "/uploads/..." y viven en el backend:
// acá les agregamos la dirección del backend para poder mostrarlas.
export const urlImagen = (ruta) => {
  if (!ruta) return null;
  return ruta.startsWith('/') ? BASE_URL + ruta : ruta;
};

async function pedir(ruta, { metodo = 'GET', headers = {}, cuerpo } = {}) {
  const cabeceras = { ...headers };
  if (TIENDA) cabeceras['X-Tienda'] = TIENDA;
  const token = leerToken();
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(BASE_URL + ruta, { method: metodo, headers: cabeceras, body: cuerpo });
  } catch {
    throw new ErrorApi('No pudimos conectar con el servidor. Revisá que la API esté encendida.', 0);
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    // la respuesta no traía JSON
  }

  if (!respuesta.ok) {
    // Token vencido o inválido: avisamos para cerrar la sesión
    if (respuesta.status === 401 && token && ruta !== '/auth/login') {
      window.dispatchEvent(new Event('sesion-vencida'));
    }
    throw new ErrorApi(datos?.error || 'Ocurrió un error inesperado.', respuesta.status);
  }
  return datos;
}

// Pedido normal con JSON
export const api = (ruta, { metodo = 'GET', cuerpo } = {}) =>
  pedir(ruta, {
    metodo,
    headers: cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {},
    cuerpo: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });

// Sube una imagen (solo admin). Devuelve la ruta para guardar, por ejemplo "/uploads/t1/ab12.jpg"
export const subirImagen = async (archivo) => {
  const datos = await pedir('/uploads', { metodo: 'POST', headers: { 'Content-Type': archivo.type }, cuerpo: archivo });
  return datos.url;
};
