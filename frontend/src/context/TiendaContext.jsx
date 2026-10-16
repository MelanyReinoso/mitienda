import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { TIENDA_POR_DEFECTO } from '../config.js';
import { aplicarTema } from '../temas.js';

const TiendaContext = createContext(null);
const CLAVE = 'tienda-config';

// Guardamos la última configuración para que, al recargar, no se vea un instante "Mi Tienda" con el color de fábrica
const leerGuardada = () => {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE));
    return datos?.tienda?.nombre ? datos : null;
  } catch {
    return null;
  }
};

export function TiendaProvider({ children }) {
  const [datos, setDatos] = useState(() => leerGuardada() || TIENDA_POR_DEFECTO);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    try {
      const nuevos = await api('/tienda');
      setDatos(nuevos);
      setError('');
      try {
        localStorage.setItem(CLAVE, JSON.stringify(nuevos));
      } catch {
        // sin localStorage: no pasa nada, solo se pierde el "recuerdo"
      }
    } catch (e) {
      setError(e.message); // se sigue mostrando lo último que se conocía
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  useEffect(() => {
    aplicarTema(datos.tienda);
    document.title = datos.tienda.nombre;
  }, [datos]);

  const valor = useMemo(
    () => ({
      tienda: datos.tienda,
      mediosPago: datos.medios_pago,
      metodosEnvio: datos.metodos_envio,
      pagosOnline: Boolean(datos.pagos_online),
      error,
      recargar,
    }),
    [datos, error, recargar]
  );

  return <TiendaContext.Provider value={valor}>{children}</TiendaContext.Provider>;
}

export const useTienda = () => useContext(TiendaContext);
