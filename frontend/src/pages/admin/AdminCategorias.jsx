import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const [nueva, setNueva] = useState('');
  const [editando, setEditando] = useState(null); // { id, nombre }
  const [eliminando, setEliminando] = useState(null); // id esperando confirmación
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const datos = await api('/categorias/admin/todas');
      setCategorias(datos.categorias);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Ejecuta una acción, muestra el resultado y recarga la lista
  const ejecutar = async (accion, textoOk) => {
    setOcupado(true);
    setError('');
    setAviso('');
    try {
      const datos = await accion();
      setAviso(typeof textoOk === 'function' ? textoOk(datos) : textoOk);
      await cargar();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const crear = async (evento) => {
    evento.preventDefault();
    const nombre = nueva.trim();
    const ok = await ejecutar(() => api('/categorias', { metodo: 'POST', cuerpo: { nombre } }), `Creaste la categoría "${nombre}".`);
    if (ok) setNueva('');
  };

  const guardarEdicion = async (evento) => {
    evento.preventDefault();
    const nombre = editando.nombre.trim();
    const ok = await ejecutar(
      () => api(`/categorias/${editando.id}`, { metodo: 'PUT', cuerpo: { nombre } }),
      `Cambiaste el nombre a "${nombre}".`
    );
    if (ok) setEditando(null);
  };

  const eliminar = async (categoria) => {
    const ok = await ejecutar(
      () => api(`/categorias/${categoria.id_categoria}`, { metodo: 'DELETE' }),
      (d) =>
        d.productos_sin_categoria > 0
          ? `Eliminaste "${categoria.nombre}". ${d.productos_sin_categoria} producto(s) quedaron sin categoría.`
          : `Eliminaste "${categoria.nombre}".`
    );
    if (ok) setEliminando(null);
  };

  return (
    <section>
      <h1 className="titulo-pagina">Categorías</h1>
      <p className="formulario-intro">Son los botones de filtro que ve la gente en el catálogo.</p>

      <form className="admin-nueva" onSubmit={crear}>
        <label className="etiqueta admin-nueva-campo">
          Nueva categoría
          <input
            className="campo"
            required
            maxLength={80}
            placeholder="Por ejemplo: Buzos"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
          />
        </label>
        <button type="submit" className="boton" disabled={ocupado}>
          Agregar
        </button>
      </form>

      <p className="aviso" role="status" aria-live="polite">
        {aviso}
      </p>
      {error && (
        <p className="mensaje error" role="alert">
          {error}
        </p>
      )}

      {cargando && <p className="estado-vacio">Cargando categorías…</p>}

      {!cargando && categorias.length === 0 && !error && (
        <p className="estado-vacio">Todavía no hay categorías. Creá la primera con el formulario de arriba.</p>
      )}

      {categorias.length > 0 && (
        <ul className="admin-lista">
          {categorias.map((c) => (
            <li key={c.id_categoria} className="admin-fila">
              {editando?.id === c.id_categoria ? (
                <form className="admin-editar" onSubmit={guardarEdicion}>
                  <input
                    className="campo"
                    required
                    maxLength={80}
                    aria-label={`Nuevo nombre para ${c.nombre}`}
                    autoFocus
                    value={editando.nombre}
                    onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                  />
                  <button type="submit" className="boton" disabled={ocupado}>
                    Guardar
                  </button>
                  <button type="button" className="enlace-boton" onClick={() => setEditando(null)}>
                    Cancelar
                  </button>
                </form>
              ) : (
                <>
                  <div className="admin-dato">
                    <span className="admin-nombre">{c.nombre}</span>
                    <span className="admin-cuenta">
                      {c.cantidad_productos === 1 ? '1 producto' : `${c.cantidad_productos} productos`}
                    </span>
                  </div>

                  {eliminando === c.id_categoria ? (
                    <div className="admin-confirmar" role="group" aria-label={`Confirmar eliminar ${c.nombre}`}>
                      <span>
                        {c.cantidad_productos > 0
                          ? `¿Eliminar? Sus ${c.cantidad_productos} producto(s) quedarán sin categoría.`
                          : '¿Eliminar esta categoría?'}
                      </span>
                      <button type="button" className="boton boton-peligro" disabled={ocupado} onClick={() => eliminar(c)}>
                        Sí, eliminar
                      </button>
                      <button type="button" className="enlace-boton" onClick={() => setEliminando(null)}>
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="admin-acciones">
                      <button
                        type="button"
                        className="enlace-boton"
                        onClick={() => {
                          setEditando({ id: c.id_categoria, nombre: c.nombre });
                          setEliminando(null);
                          setAviso('');
                        }}
                      >
                        Renombrar
                      </button>
                      <button
                        type="button"
                        className="enlace-boton"
                        onClick={() => {
                          setEliminando(c.id_categoria);
                          setEditando(null);
                          setAviso('');
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
