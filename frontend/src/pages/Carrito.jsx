import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useTienda } from '../context/TiendaContext.jsx';
import { colorHex, precio } from '../utils/formato.js';

export default function Carrito() {
  const { usuario } = useAuth();
  const { items, subtotal, cambiarCantidad, quitar, vaciar } = useCart();
  const { mediosPago } = useTienda();
  const conDescuento = mediosPago.find((m) => m.descuento_porcentaje > 0);

  if (items.length === 0) {
    return (
      <section>
        <h1 className="titulo-pagina">Carrito</h1>
        <p className="estado-vacio">Tu carrito está vacío.</p>
        <Link to="/" className="boton">
          Ver el catálogo
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h1 className="titulo-pagina">Carrito</h1>

      <div className="carrito">
        <ul className="carrito-lista">
          {items.map((item) => (
            <li key={item.id_variante} className="carrito-item">
              <span className="carrito-color" style={{ backgroundColor: colorHex(item.color, item.color_hex) }} aria-hidden="true" />

              <div className="carrito-detalle">
                <Link to={`/producto/${item.id_producto}`} className="carrito-nombre">
                  {item.nombre}
                </Link>
                <span className="carrito-variante">
                  Talle {item.talle}, {item.color}
                </span>
                <span className="carrito-unitario">{precio(item.precio)} c/u</span>
              </div>

              <div className="cantidad" role="group" aria-label={`Cantidad de ${item.nombre}`}>
                <button
                  type="button"
                  aria-label="Una unidad menos"
                  onClick={() => cambiarCantidad(item.id_variante, item.cantidad - 1)}
                >
                  −
                </button>
                <output aria-live="polite">{item.cantidad}</output>
                <button
                  type="button"
                  aria-label="Una unidad más"
                  disabled={item.cantidad >= item.stock}
                  onClick={() => cambiarCantidad(item.id_variante, item.cantidad + 1)}
                >
                  +
                </button>
              </div>

              <span className="carrito-total">{precio(item.precio * item.cantidad)}</span>

              <button type="button" className="enlace-boton" onClick={() => quitar(item.id_variante)}>
                Quitar
              </button>
            </li>
          ))}
        </ul>

        <aside className="resumen">
          <h2>Resumen</h2>
          <p className="resumen-fila">
            <span>Subtotal</span>
            <strong>{precio(subtotal)}</strong>
          </p>
          <p className="resumen-nota">
            El costo de envío se suma en el siguiente paso. El total final lo confirma la tienda al comprar.
            {conDescuento && ` Pagando con ${conDescuento.nombre.toLowerCase()} tenés ${conDescuento.descuento_porcentaje}% de descuento.`}
          </p>

          {usuario ? (
            <Link to="/checkout" className="boton boton-ancho">
              Finalizar compra
            </Link>
          ) : (
            <Link to="/ingresar?volver=/checkout" className="boton boton-ancho">
              Ingresá para comprar
            </Link>
          )}

          <button type="button" className="enlace-boton" onClick={vaciar}>
            Vaciar carrito
          </button>
        </aside>
      </div>
    </section>
  );
}
