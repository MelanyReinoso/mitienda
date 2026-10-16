import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Para pantallas que exigen haber iniciado sesión. Después de ingresar, la persona vuelve a donde estaba.
// (La seguridad real está en el backend: cada pedido a la API vuelve a verificar la sesión.)
export default function RutaPrivada({ children }) {
  const { usuario } = useAuth();
  const ubicacion = useLocation();

  if (!usuario) {
    return <Navigate to={`/ingresar?volver=${encodeURIComponent(ubicacion.pathname)}`} replace />;
  }
  return children;
}
