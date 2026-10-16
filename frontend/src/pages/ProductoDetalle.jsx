import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import CampoColor from '../components/CampoColor.jsx';
import { useCart } from '../context/CartContext.jsx';
import { colorHex, coloresDe, ordenarTalles, precio } from '../utils/formato.js';

export default function ProductoDetalle() {
  const { id } = useParams();
  const [estado, setEstado] = useState({ cargando: true, producto: null, error: '' });

  useEffect(() => {
    let cancelado = false;
    setEstado({ cargando: true, producto: null, error: '' });

    api(`/productos/${id}`)
      .then((d) => !cancelado && setEstado({ cargando: false, producto: d.producto, error: '' }))
      .catch(
        (e) =>
          !cancelado &&
          setEstado({
            cargando: false,
            producto: null,
            error: e.estado === 404 ? 'Este producto no existe o ya no está disponible.' : e.message,
          })
      );

    return () => {
      cancelado = true;
    };
  }, [id]);

  if (estado.cargando) return <p className="estado-vacio">Cargando producto…</p>;

  if (estado.error) {
    return (
      <div>
        <p className="mensaje error" role="alert">
          {estado.error}
        </p>
        <Link to="/" className="enlace">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  // key: al cambiar de producto, la ficha se reinicia sola (color y talle elegidos)
  return <Ficha key={estado.producto.id_producto} producto={estado.producto} />;
}

function Ficha({ producto }) {
  const { items, agregar } = useCart();

  const colores = coloresDe(producto.variantes); // [{ color, hex }]
  const hexDe = (nombre) => colores.find((c) => c.color === nombre)?.hex;
  const colorInicial =
    colores.find((c) => producto.variantes.some((v) => v.color === c.color && v.stock > 0))?.color ?? colores[0]?.color;

  const [color, setColor] = useState(colorInicial);
  const [talle, setTalle] = useState(null);
  const [aviso, setAviso] = useState('');

  const delColor = producto.variantes.filter((v) => v.color === color).sort((a, b) => ordenarTalles(a.talle, b.talle));
  const variante = delColor.find((v) => v.talle === talle) ?? null;

  // Cuántas unidades de esta variante ya hay en el carrito (no se puede superar el stock)
  const enCarrito = items.find((x) => x.id_variante === variante?.id_variante)?.cantidad ?? 0;
  const disponibles = variante ? variante.stock - enCarrito : 0;

  const elegirColor = (nuevo) => {
    setColor(nuevo);
    setTalle(null); // los talles disponibles cambian con el color
    setAviso('');
  };

  const agregarAlCarrito = () => {
    agregar({
      id_variante: variante.id_variante,
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      talle: variante.talle,
      color: variante.color,
      color_hex: variante.color_hex,
      precio: variante.precio,
      stock: variante.stock,
      imagen_url: producto.imagen_url,
    });
    setAviso(`Agregaste ${producto.nombre}, talle ${variante.talle}, ${variante.color}.`);
  };

  let textoBoton = 'Agregar al carrito';
  if (!variante) textoBoton = 'Elegí un talle';
  else if (variante.stock === 0) textoBoton = 'Sin stock';
  else if (disponibles < 1) textoBoton = 'Ya tenés todo el stock en el carrito';

  return (
    <article className="ficha">
      <CampoColor color={color} hex={hexDe(color)} nombre={producto.nombre} imagen={producto.imagen_url} grande />

      <div className="ficha-info">
        <Link to="/" className="enlace volver">
          Volver al catálogo
        </Link>

        <h1 className="ficha-titulo">{producto.nombre}</h1>
        {producto.categoria && <p className="ficha-categoria">{producto.categoria}</p>}

        <p className="ficha-precio">
          {variante ? precio(variante.precio) : `Desde ${precio(producto.precio_desde)}`}
        </p>

        {producto.descripcion && <p className="ficha-descripcion">{producto.descripcion}</p>}

        <fieldset className="opciones">
          <legend>Color: {color}</legend>
          <div className="opciones-fila">
            {colores.map((c) => (
              <button
                key={c.color}
                type="button"
                className="muestra-grande"
                style={{ backgroundColor: colorHex(c.color, c.hex) }}
                aria-label={c.color}
                aria-pressed={c.color === color}
                title={c.color}
                onClick={() => elegirColor(c.color)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="opciones">
          <legend>Talle</legend>
          <div className="opciones-fila">
            {delColor.map((v) => (
              <button
                key={v.id_variante}
                type="button"
                className="talle"
                aria-pressed={v.talle === talle}
                disabled={v.stock === 0}
                title={v.stock === 0 ? 'Sin stock' : undefined}
                onClick={() => {
                  setTalle(v.talle);
                  setAviso('');
                }}
              >
                {v.talle}
              </button>
            ))}
          </div>
          {variante && variante.stock > 0 && variante.stock <= 3 && (
            <p className="pocas-unidades">
              {variante.stock === 1 ? 'Queda 1 unidad' : `Quedan ${variante.stock} unidades`}
            </p>
          )}
        </fieldset>

        <button type="button" className="boton boton-ancho" disabled={!variante || disponibles < 1} onClick={agregarAlCarrito}>
          {textoBoton}
        </button>

        <p className="aviso" role="status" aria-live="polite">
          {aviso}
          {aviso && (
            <>
              {' '}
              <Link to="/carrito" className="enlace">
                Ver carrito
              </Link>
            </>
          )}
        </p>
      </div>
    </article>
  );
}
