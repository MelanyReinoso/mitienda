import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, urlImagen } from '../../api.js';
import { colorHex, precio } from '../../utils/formato.js';

const sinTildes = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function Miniatura({ producto }) {
  const primero = producto.variantes[0];
  return (
    <span className="miniatura" style={{ backgroundColor: colorHex(primero?.color ?? '', primero?.color_hex) }}>
      {producto.imagen_url && <img src={urlImagen(producto.imagen_url)} alt="" loading="lazy" />}
    </span>
  );
}

export default function AdminProductos() {
  const { state } = useLocation();
  const [estado, setEstado] = useState({ cargando: true, productos: [], error: '' });
  const [busqueda, setBusqueda] = useState('');
  const [aviso, setAviso] = useState(state?.aviso || '');
  const [errorAccion, setErrorAccion] = useState('');
  const [eliminando, setEliminando] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const d = await api('/productos/admin/todos?limite=100');
      setEstado({ cargando: false, productos: d.productos, error: '' });
    } catch (e) {
      setEstado({ cargando: false, productos: [], error: e.message });
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const ejecutar = async (accion, textoOk) => {
    setOcupado(true);
    setAviso('');
    setErrorAccion('');
    try {
      await accion();
      setAviso(textoOk);
      await cargar();
      return true;
    } catch (e) {
      setErrorAccion(e.message);
      return false;
    } finally {
      setOcupado(false);
    }
  };

  // Mostrar u ocultar en la tienda (se manda el producto completo con el "activo" cambiado)
  const alternar = (p) =>
    ejecutar(
      () =>
        api(`/productos/${p.id_producto}`, {
          metodo: 'PUT',
          cuerpo: { nombre: p.nombre, descripcion: p.descripcion, imagen_url: p.imagen_url, id_categoria: p.id_categoria, activo: !p.activo },
        }),
      p.activo ? `"${p.nombre}" ya no se ve en la tienda.` : `"${p.nombre}" ya se ve en la tienda.`
    );

  const eliminar = async (p) => {
    const ok = await ejecutar(() => api(`/productos/${p.id_producto}`, { metodo: 'DELETE' }), `Eliminaste "${p.nombre}".`);
    if (ok) setEliminando(null);
  };

  const { cargando, productos, error } = estado;
  const visibles = productos.filter((p) => sinTildes(p.nombre).includes(sinTildes(busqueda.trim())));

  return (
    <section>
      <div className="admin-encabezado">
        <h1 className="titulo-pagina">Productos</h1>
        <Link to="/admin/productos/nuevo" className="boton">
          Nuevo producto
        </Link>
      </div>

      <input
        type="search"
        className="campo buscador"
        placeholder="Buscar por nombre"
        aria-label="Buscar por nombre"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <p className="aviso" role="status" aria-live="polite">
        {aviso}
      </p>
      {(error || errorAccion) && (
        <p className="mensaje error" role="alert">
          {error || errorAccion}
        </p>
      )}

      {cargando && <p className="estado-vacio">Cargando productos…</p>}

      {!cargando && !error && productos.length === 0 && (
        <p className="estado-vacio">Todavía no cargaste productos. Empezá con el botón "Nuevo producto".</p>
      )}
      {!cargando && productos.length > 0 && visibles.length === 0 && <p className="estado-vacio">Ningún producto coincide con la búsqueda.</p>}

      {visibles.length > 0 && (
        <ul className="prod-lista">
          {visibles.map((p) => (
            <li key={p.id_producto} className="prod-fila">
              <Miniatura producto={p} />

              <div className="prod-info">
                <Link to={`/admin/productos/${p.id_producto}`} className="admin-nombre prod-nombre">
                  {p.nombre}
                </Link>
                <span className="admin-cuenta">
                  {p.categoria || 'Sin categoría'}
                  {p.precio_desde !== null && ` · desde ${precio(p.precio_desde)}`}
                  {` · ${p.variantes.length} variante(s) · `}
                  {p.stock_total === 0 ? 'sin stock' : `${p.stock_total} en stock`}
                </span>
              </div>

              <span className={p.activo ? 'estado estado-entregado' : 'estado'}>{p.activo ? 'Visible' : 'Oculto'}</span>

              {eliminando === p.id_producto ? (
                <div className="admin-confirmar" role="group" aria-label={`Confirmar eliminar ${p.nombre}`}>
                  <span>¿Eliminar para siempre?</span>
                  <button type="button" className="boton boton-peligro" disabled={ocupado} onClick={() => eliminar(p)}>
                    Sí, eliminar
                  </button>
                  <button type="button" className="enlace-boton" onClick={() => setEliminando(null)}>
                    No
                  </button>
                </div>
              ) : (
                <div className="admin-acciones">
                  <Link to={`/admin/productos/${p.id_producto}`} className="enlace">
                    Editar
                  </Link>
                  <button type="button" className="enlace-boton" disabled={ocupado} onClick={() => alternar(p)}>
                    {p.activo ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button type="button" className="enlace-boton" onClick={() => setEliminando(p.id_producto)}>
                    Eliminar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {productos.length === 100 && <p className="ayuda">Se muestran los últimos 100 productos.</p>}
    </section>
  );
}
