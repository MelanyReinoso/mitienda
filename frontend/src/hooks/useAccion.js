import { useState } from 'react';

// Ejecuta una acción de guardado y lleva la cuenta de "guardando / guardado / error".
//   const [estado, ejecutar] = useAccion();
//   const ok = await ejecutar(() => api(...), 'Guardado.');   // devuelve true o false
export function useAccion() {
  const [estado, setEstado] = useState({ ocupado: false, aviso: '', error: '' });
  const ejecutar = async (accion, textoOk) => {
    setEstado({ ocupado: true, aviso: '', error: '' });
    try {
      await accion();
      setEstado({ ocupado: false, aviso: textoOk, error: '' });
      return true;
    } catch (e) {
      setEstado({ ocupado: false, aviso: '', error: e.message });
      return false;
    }
  };
  return [estado, ejecutar];
}
