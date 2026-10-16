import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import { useTienda } from '../context/TiendaContext.jsx';

export default function Catalogo() {
  // Los filtros viven en la URL (/?categoria=2&q=remera): se puede compartir el link y funciona el botón "atrás"
  const { tienda } = useTienda();
  const [params, setParams] = useSearchParams();
  const categoria = params.get('categoria') || '';
  const q = params.get('q') || '';

  const [busqueda, setBusqueda] = useState(q);
  const [categorias, setCategorias] = useState([]);
  const [estado, setEstado] = useState({ cargando: true, productos: [], error: '' });

  // Categorías (una sola vez)
  useEffect(() => {
    api('/categorias')
      .then((d) => setCategorias(d.categorias))
      .catch(() => setCategorias([])); // si falla, el catálogo igual se muestra completo
  }, []);

  // Esperamos 300 ms después de que la persona deja de escribir antes de buscar
  useEffect(() => {
    const espera = setTimeout(() => {
      if (busqueda.trim() !== q) {
        setParams(
          (previos) => {
            const nuevos = new URLSearchParams(previos);
            if (busqueda.trim()) nuevos.set('q', busqueda.trim());
            else nuevos.delete('q');
            return nuevos;
          },
          { replace: true }
        );
      }
    }, 300);
    return () => clearTimeout(espera);
  }, [busqueda, q, setParams]);

  // Productos: se vuelven a pedir cuando cambia la categoría o la búsqueda
  useEffect(() => {
    let cancelado = false; // evita mostrar una respuesta vieja si ya se pidió otra
    setEstado((previo) => ({ ...previo, cargando: true, error: '' }));

    const consulta = new URLSearchParams();
    if (categoria) consulta.set('categoria', categoria);
    if (q) consulta.set('q', q);

    api(`/productos?${consulta}`)
      .then((d) => !cancelado && setEstado({ cargando: false, productos: d.productos, error: '' }))
      .catch((e) => !cancelado && setEstado({ cargando: false, productos: [], error: e.message }));

    return () => {
      cancelado = true;
    };
  }, [categoria, q]);

  const elegirCategoria = (id) => {
    setParams((previos) => {
      const nuevos = new URLSearchParams(previos);
      if (id) nuevos.set('categoria', id);
      else nuevos.delete('categoria');
      return nuevos;
    });
  };

  const { cargando, productos, error } = estado;

  return (
    <section>
      {tienda.portada_titulo ? (
        <header className="portada">
          <h1>{tienda.portada_titulo}</h1>
          {tienda.portada_texto && <p>{tienda.portada_texto}</p>}
        </header>
      ) : (
        <h1 className="titulo-pagina">Catálogo</h1>
      )}

      <div className="filtros">
        <div className="categorias" role="group" aria-label="Categorías">
          <button type="button" className="chip" aria-pressed={!categoria} onClick={() => elegirCategoria('')}>
            Todo
          </button>
          {categorias.map((c) => (
            <button
              key={c.id_categoria}
              type="button"
              className="chip"
              aria-pressed={categoria === String(c.id_categoria)}
              onClick={() => elegirCategoria(String(c.id_categoria))}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        <input
          type="search"
          className="campo buscador"
          placeholder="Buscar por nombre"
          aria-label="Buscar por nombre"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {error && (
        <p className="mensaje error" role="alert">
          {error}
        </p>
      )}

      {cargando && productos.length === 0 && !error && <p className="estado-vacio">Cargando productos…</p>}

      {!cargando && !error && productos.length === 0 && (
        <p className="estado-vacio">
          No encontramos productos con esos filtros. Probá con otra categoría o borrá la búsqueda.
        </p>
      )}

      {productos.length > 0 && (
        <ul className="grilla" aria-busy={cargando}>
          {productos.map((p) => (
            <TarjetaProducto key={p.id_producto} producto={p} />
          ))}
        </ul>
      )}
    </section>
  );
}
