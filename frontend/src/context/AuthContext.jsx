import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, guardarToken } from '../api.js';

const AuthContext = createContext(null);

const leerUsuarioGuardado = () => {
  try {
    // Sin token no hay sesión, aunque haya quedado un usuario guardado
    if (!localStorage.getItem('token')) return null;
    return JSON.parse(localStorage.getItem('usuario'));
  } catch {
    return null;
  }
};

const guardarUsuario = (usuario) => {
  try {
    if (usuario) localStorage.setItem('usuario', JSON.stringify(usuario));
    else localStorage.removeItem('usuario');
  } catch {
    // sin localStorage: la sesión dura hasta recargar
  }
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuarioGuardado);

  const abrirSesion = useCallback((datos) => {
    guardarToken(datos.token);
    guardarUsuario(datos.usuario);
    setUsuario(datos.usuario);
    return datos.usuario;
  }, []);

  const cerrarSesion = useCallback(() => {
    guardarToken(null);
    guardarUsuario(null);
    setUsuario(null);
  }, []);

  // Si el servidor dice que el token venció, cerramos la sesión
  useEffect(() => {
    window.addEventListener('sesion-vencida', cerrarSesion);
    return () => window.removeEventListener('sesion-vencida', cerrarSesion);
  }, [cerrarSesion]);

  const ingresar = useCallback(
    async (email, password) => abrirSesion(await api('/auth/login', { metodo: 'POST', cuerpo: { email, password } })),
    [abrirSesion]
  );

  const registrarse = useCallback(
    async (campos) => abrirSesion(await api('/auth/registro', { metodo: 'POST', cuerpo: campos })),
    [abrirSesion]
  );

  const valor = useMemo(
    () => ({ usuario, esAdmin: usuario?.rol === 'admin', ingresar, registrarse, cerrarSesion }),
    [usuario, ingresar, registrarse, cerrarSesion]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
