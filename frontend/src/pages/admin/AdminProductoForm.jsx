import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api.js';
import Mensajes from '../../components/Mensajes.jsx';
import SubirImagen from '../../components/SubirImagen.jsx';
import { useAccion } from '../../hooks/useAccion.js';
import { NOMBRES_COLORES, colorHex, hexConocido } from '../../utils/formato.js';

// ---------------------------------------------------------------- Variantes (talle + color + precio + stock)
let contador = 0;
const clave = () => {
  contador += 1;
  return contador;
};

const varianteVacia = () => ({ clave: clave(), id_variante: null, talle: '', color: '', color_hex: '', sku: '', precio: '', stock: '0' });
const desdeApi = (v) => ({
  clave: clave(),
  id_variante: v.id_variante,
  talle: v.talle,
  color: v.color,
  color_hex: v.color_hex || '',
  sku: v.sku || '',
  precio: String(v.precio),
  stock: String(v.stock),
});
// Lo que se manda al servidor (el servidor igual vuelve a validar todo)
const aPayload = (v) => ({
  talle: v.talle.trim(),
  color: v.color.trim(),
  color_hex: v.color_hex || hexConocido(v.color) || null,
  sku: v.sku.trim() || null,
  precio: Number(v.precio),
  stock: Number(v.stock),
});

function CamposVariante({ v, onCambiar }) {
  const cambiar = (campo) => (e) => onCambiar({ ...v, [campo]: e.target.value });
  return (
    <div className="variante-campos">
      <label className="etiqueta">
        Talle
        <input className="campo" required maxLength={20} placeholder="M, 40, Único" value={v.talle} onChange={cambiar('talle')} />
      </label>
      <label className="etiqueta">
        Color
        <input className="campo" required maxLength={30} list="colores-comunes" placeholder="Negro" value={v.color} onChange={cambiar('color')} />
      </label>
      <div className="etiqueta">
        <label htmlFor={`hex-${v.clave}`}>Tono</label>
        <input
          id={`hex-${v.clave}`}
          type="color"
          className="selector-color"
          value={v.color_hex || colorHex(v.color)}
          onChange={cambiar('color_hex')}
          title="Tono con el que se pinta este color en la tienda"
        />
      </div>
      <label className="etiqueta">
        Precio ($)
        <input className="campo" type="number" required min="0.01" step="0.01" value={v.precio} onChange={cambiar('precio')} />
      </label>
      <label className="etiqueta">
        Stock
        <input className="campo" type="number" required min="0" max="100000" step="1" value={v.stock} onChange={cambiar('stock')} />
      </label>
      <label className="etiqueta">
        Código (opcional)
        <input className="campo" maxLength={50} placeholder="SKU" value={v.sku} onChange={cambiar('sku')} />
      </label>
    </div>
  );
}

// Una variante de un producto que YA existe: cada una se guarda y se elimina por separado
function VarianteGuardable({ inicial, idProducto, alEliminar }) {
  const [v, setV] = useState(inicial);
  const [id, setId] = useState(inicial.id_variante);
  const [estado, ejecutar] = useAccion();
  const [confirmando, setConfirmando] = useState(false);

  const guardar = (evento) => {
    evento.preventDefault();
    ejecutar(async () => {
      const cuerpo = aPayload(v);
      if (id) {
        await api(`/variantes/${id}`, { metodo: 'PUT', cuerpo });
      } else {
        const d = await api(`/productos/${idProducto}/variantes`, { metodo: 'POST', cuerpo });
        setId(d.id_variante);
      }
    }, 'Guardado.');
  };

  const eliminar = async () => {
    if (!id) return alEliminar();
    const ok = await ejecutar(() => api(`/variantes/${id}`, { metodo: 'DELETE' }), 'Eliminada.');
    if (ok) alEliminar();
    else setConfirmando(false);
    return undefined;
  };

  return (
    <form className="variante-fila" onSubmit={guardar}>
      <CamposVariante v={v} onCambiar={setV} />
      <div className="admin-acciones">
        <button type="submit" className="boton" disabled={estado.ocupado}>
          {id ? 'Guardar cambios' : 'Agregar variante'}
        </button>
        {confirmando ? (
          <span className="admin-confirmar" role="group" aria-label="Confirmar eliminar variante">
            <span>¿Eliminar?</span>
            <button type="button" className="boton boton-peligro" disabled={estado.ocupado} onClick={eliminar}>
              Sí
            </button>
            <button type="button" className="enlace-boton" onClick={() => setConfirmando(false)}>
              No
            </button>
          </span>
        ) : (
          <button type="button" className="enlace-boton" onClick={() => (id ? setConfirmando(true) : alEliminar())}>
            {id ? 'Eliminar' : 'Descartar'}
          </button>
        )}
      </div>
      <Mensajes estado={estado} />
    </form>
  );
}

// ---------------------------------------------------------------- Página (sirve para crear y para editar)
export default function AdminProductoForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navegar = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(editando);
  const [errorCarga, setErrorCarga] = useState('');
  const [campos, setCampos] = useState({ nombre: '', descripcion: '', id_categoria: '', imagen_url: '', activo: true });
  const [variantes, setVariantes] = useState(editando ? [] : [varianteVacia()]); // al crear: filas del formulario
  const [existentes, setExistentes] = useState([]); // al editar: variantes ya guardadas
  const [estado, ejecutar] = useAccion();
  const [confirmaBorrar, setConfirmaBorrar] = useState(false);

  useEffect(() => {
    api('/categorias')
      .then((d) => setCategorias(d.categorias))
      .catch(() => setCategorias([]));
  }, []);

  useEffect(() => {
    if (!editando) return undefined;
    let cancelado = false;
    api(`/productos/admin/${id}`)
      .then(({ producto: p }) => {
        if (cancelado) return;
        setCampos({
          nombre: p.nombre,
          descripcion: p.descripcion || '',
          id_categoria: p.id_categoria ? String(p.id_categoria) : '',
          imagen_url: p.imagen_url || '',
          activo: p.activo,
        });
        setExistentes(p.variantes.map(desdeApi));
        setCargando(false);
      })
      .catch((e) => {
        if (cancelado) return;
        setErrorCarga(e.message);
        setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [editando, id]);

  const cuerpoProducto = () => ({
    nombre: campos.nombre.trim(),
    descripcion: campos.descripcion.trim(),
    imagen_url: campos.imagen_url,
    id_categoria: campos.id_categoria ? Number(campos.id_categoria) : null,
    activo: campos.activo,
  });

  const cambiar = (e) => setCampos({ ...campos, [e.target.name]: e.target.value });

  const guardar = async (evento) => {
    evento.preventDefault();
    if (editando) {
      ejecutar(() => api(`/productos/${id}`, { metodo: 'PUT', cuerpo: cuerpoProducto() }), 'Guardaste los datos del producto.');
      return;
    }
    let nuevoId = null;
    const ok = await ejecutar(async () => {
      const d = await api('/productos', { metodo: 'POST', cuerpo: { ...cuerpoProducto(), variantes: variantes.map(aPayload) } });
      nuevoId = d.id_producto;
    }, 'Producto creado.');
    if (ok) navegar('/admin/productos', { state: { aviso: `Creaste "${campos.nombre.trim()}".` }, replace: true });
    return nuevoId;
  };

  const eliminar = async () => {
    const ok = await ejecutar(() => api(`/productos/${id}`, { metodo: 'DELETE' }), 'Eliminado.');
    if (ok) navegar('/admin/productos', { state: { aviso: `Eliminaste "${campos.nombre}".` }, replace: true });
    else setConfirmaBorrar(false);
  };

  if (cargando) return <p className="estado-vacio">Cargando producto…</p>;
  if (errorCarga) {
    return (
      <section>
        <p className="mensaje error" role="alert">
          {errorCarga}
        </p>
        <Link to="/admin/productos" className="enlace">
          Volver a productos
        </Link>
      </section>
    );
  }

  return (
    <section>
      <Link to="/admin/productos" className="enlace volver">
        Volver a productos
      </Link>
      <h1 className="titulo-pagina">{editando ? 'Editar producto' : 'Nuevo producto'}</h1>

      <datalist id="colores-comunes">
        {NOMBRES_COLORES.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <div className="config">
        <form className="formulario config-seccion" onSubmit={guardar}>
          <h2>Datos del producto</h2>

          <SubirImagen
            etiqueta="Foto del producto"
            ayuda="Mejor vertical (por ejemplo 800 × 1000 px), en JPG, PNG o WebP, hasta 3 MB. Si no subís foto, se muestra el color de la prenda con su nombre."
            valor={campos.imagen_url}
            textoAlt="Vista previa de la foto"
            onChange={(url) => setCampos({ ...campos, imagen_url: url })}
          />

          <label className="etiqueta">
            Nombre
            <input className="campo" name="nombre" required maxLength={150} value={campos.nombre} onChange={cambiar} />
          </label>

          <label className="etiqueta">
            Descripción (opcional)
            <textarea className="campo" name="descripcion" rows={4} maxLength={5000} value={campos.descripcion} onChange={cambiar} />
          </label>

          <label className="etiqueta">
            Categoría
            <select className="campo" name="id_categoria" value={campos.id_categoria} onChange={cambiar}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <span className="ayuda">
              ¿Falta una?{' '}
              <Link to="/admin/categorias" className="enlace">
                Administrar categorías
              </Link>
            </span>
          </label>

          <label className="etiqueta-check">
            <input type="checkbox" checked={campos.activo} onChange={(e) => setCampos({ ...campos, activo: e.target.checked })} />
            Visible en la tienda
          </label>

          {!editando && (
            <div className="variantes">
              <h2>Talles, colores y precios</h2>
              <p className="formulario-intro">Cada combinación de talle y color tiene su propio precio y stock. Cargá al menos una.</p>
              {variantes.map((v, i) => (
                <div key={v.clave} className="variante-fila">
                  <CamposVariante v={v} onCambiar={(nueva) => setVariantes(variantes.map((x) => (x.clave === v.clave ? nueva : x)))} />
                  {variantes.length > 1 && (
                    <button type="button" className="enlace-boton" onClick={() => setVariantes(variantes.filter((x) => x.clave !== v.clave))}>
                      Quitar variante {i + 1}
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="boton boton-secundario" onClick={() => setVariantes([...variantes, varianteVacia()])}>
                Agregar otra variante
              </button>
            </div>
          )}

          <Mensajes estado={estado} />
          <button type="submit" className="boton" disabled={estado.ocupado}>
            {estado.ocupado ? 'Guardando…' : editando ? 'Guardar datos' : 'Crear producto'}
          </button>
        </form>

        {editando && (
          <section className="config-seccion variantes" aria-labelledby="titulo-variantes">
            <h2 id="titulo-variantes">Talles, colores y precios</h2>
            <p className="formulario-intro">
              Cada fila se guarda por separado. Para dejar de vender una variante, poné su stock en 0 (si ya se vendió alguna vez, no se puede eliminar).
            </p>
            {existentes.map((v) => (
              <VarianteGuardable
                key={v.clave}
                inicial={v}
                idProducto={id}
                alEliminar={() => setExistentes((lista) => lista.filter((x) => x.clave !== v.clave))}
              />
            ))}
            <button type="button" className="boton boton-secundario" onClick={() => setExistentes([...existentes, varianteVacia()])}>
              Agregar variante
            </button>
          </section>
        )}

        {editando && (
          <section className="config-seccion" aria-labelledby="titulo-borrar">
            <h2 id="titulo-borrar">Eliminar producto</h2>
            <p className="formulario-intro">
              Se borra para siempre, con su foto y sus variantes. Si ya tiene pedidos no se puede eliminar: en ese caso destildá "Visible en la tienda" y guardá.
            </p>
            {confirmaBorrar ? (
              <div className="admin-confirmar" role="group" aria-label="Confirmar eliminar producto">
                <span>¿Seguro?</span>
                <button type="button" className="boton boton-peligro" disabled={estado.ocupado} onClick={eliminar}>
                  Sí, eliminar
                </button>
                <button type="button" className="enlace-boton" onClick={() => setConfirmaBorrar(false)}>
                  No
                </button>
              </div>
            ) : (
              <button type="button" className="boton boton-peligro" onClick={() => setConfirmaBorrar(true)}>
                Eliminar producto
              </button>
            )}
          </section>
        )}
      </div>
    </section>
  );
}
