import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Envuelve las pantallas del administrador.
// OJO: esto solo cuida la pantalla. La seguridad real está en el backend, que vuelve a verificar el rol en cada pedido.
export default function RutaAdmin({ children }) {
  const { usuario, esAdmin } = useAuth();
  const ubicacion = useLocation();

  if (!usuario) {
    return <Navigate to={`/ingresar?volver=${encodeURIComponent(ubicacion.pathname)}`} replace />;
  }

  if (!esAdmin) {
    return (
      <section>
        <h1 className="titulo-pagina">Sin permiso</h1>
        <p className="estado-vacio">Esta sección es solo para administradores de la tienda.</p>
        <Link to="/" className="boton">
          Ir al catálogo
        </Link>
      </section>
    );
  }

  return children;
}
