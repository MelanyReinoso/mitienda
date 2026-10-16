import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { urlImagen } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useTienda } from '../context/TiendaContext.jsx';

export default function Navbar() {
  const { usuario, esAdmin, cerrarSesion } = useAuth();
  const { cantidadTotal } = useCart();
  const { tienda } = useTienda();
  const [logoRoto, setLogoRoto] = useState(false);
  const claseLink = ({ isActive }) => (isActive ? 'nav-link activo' : 'nav-link');

  return (
    <>
      {tienda.aviso && <p className="aviso-tienda">{tienda.aviso}</p>}
    <header className="navbar">
      <div className="contenedor navbar-interior">
        <Link to="/" className="marca">
          {tienda.logo_url && !logoRoto ? (
            <img className="marca-logo" src={urlImagen(tienda.logo_url)} alt={tienda.nombre} onError={() => setLogoRoto(true)} />
          ) : (
            tienda.nombre
          )}
        </Link>

        <nav className="navbar-menu" aria-label="Principal">
          <NavLink to="/" end className={claseLink}>
            Catálogo
          </NavLink>
          <NavLink to="/carrito" className={claseLink}>
            Carrito{cantidadTotal > 0 && <span className="contador">{cantidadTotal}</span>}
          </NavLink>

          {usuario && (
            <NavLink to="/mis-pedidos" className={claseLink}>
              Mis pedidos
            </NavLink>
          )}

          {esAdmin && (
            <>
              <NavLink to="/admin/pedidos" className={claseLink}>
                Ventas
              </NavLink>
              <NavLink to="/admin/productos" className={claseLink}>
                Productos
              </NavLink>
              <NavLink to="/admin/categorias" className={claseLink}>
                Categorías
              </NavLink>
              <NavLink to="/admin/configuracion" className={claseLink}>
                Configuración
              </NavLink>
            </>
          )}

          {usuario ? (
            <>
              <span className="nav-usuario">Hola, {usuario.nombre}</span>
              <button type="button" className="nav-link nav-boton" onClick={cerrarSesion}>
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/ingresar" className={claseLink}>
                Ingresar
              </NavLink>
              <NavLink to="/registro" className={claseLink}>
                Crear cuenta
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
    </>
  );
}
