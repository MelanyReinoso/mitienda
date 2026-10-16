import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useTienda } from '../context/TiendaContext.jsx';
import { colorHex, precio, urlMercadoPago } from '../utils/formato.js';

export default function Checkout() {
  const navegar = useNavigate();
  const { items, subtotal, vaciar } = useCart();
  const { mediosPago, metodosEnvio, pagosOnline } = useTienda();

  const [envioId, setEnvioId] = useState(null);
  const [pagoCodigo, setPagoCodigo] = useState(null);
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (items.length === 0) {
    return (
      <section>
        <h1 className="titulo-pagina">Finalizar compra</h1>
        <p className="estado-vacio">Tu carrito está vacío.</p>
        <Link to="/" className="boton">
          Ver el catálogo
        </Link>
      </section>
    );
  }

  if (metodosEnvio.length === 0 || mediosPago.length === 0) {
    return (
      <section>
        <h1 className="titulo-pagina">Finalizar compra</h1>
        <p className="mensaje error" role="alert">
          La tienda todavía no tiene {metodosEnvio.length === 0 ? 'métodos de envío' : 'medios de pago'} disponibles. Probá de nuevo más tarde.
        </p>
      </section>
    );
  }

  // Si todavía no eligió nada, queda marcada la primera opción
  const envio = metodosEnvio.find((e) => e.id_envio === envioId) ?? metodosEnvio[0];
  const pago = mediosPago.find((m) => m.codigo === pagoCodigo) ?? mediosPago[0];

  // Vista previa del total (en centavos, igual que el servidor). Al confirmar, el que manda es el servidor.
  const subtotalCent = Math.round(subtotal * 100);
  const descuentoCent = Math.round((subtotalCent * pago.descuento_porcentaje) / 100);
  const envioCent = Math.round(envio.costo * 100);
  const totalCent = subtotalCent - descuentoCent + envioCent;

  const confirmar = async (evento) => {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const datos = await api('/pedidos', {
        metodo: 'POST',
        cuerpo: {
          metodo_pago: pago.codigo,
          id_envio: envio.id_envio,
          direccion_envio: envio.requiere_direccion ? direccion.trim() : undefined,
          items: items.map((i) => ({ id_variante: i.id_variante, cantidad: i.cantidad })),
        },
      });
      vaciar();
      // Con Mercado Pago habilitado, se manda al cliente a pagar. Si algo falla, el pedido igual quedó
      // guardado y puede reintentar el pago desde la pantalla del pedido.
      if (pago.codigo === 'mercadopago' && pagosOnline) {
        try {
          const { url } = await api(`/pedidos/${datos.id_pedido}/pagar-mp`, { metodo: 'POST' });
          if (urlMercadoPago(url)) {
            window.location.assign(url);
            return;
          }
        } catch {
          // se sigue a la pantalla del pedido, donde está el botón para reintentar
        }
      }
      navegar(`/pedido/${datos.id_pedido}`, { replace: true, state: { nuevo: true } });
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  };

  return (
    <section>
      <h1 className="titulo-pagina">Finalizar compra</h1>

      <form className="carrito" onSubmit={confirmar}>
        <div className="checkout-pasos">
          <fieldset className="paso">
            <legend>Cómo querés recibirlo</legend>
            {metodosEnvio.map((e) => (
              <label key={e.id_envio} className="opcion-radio">
                <input type="radio" name="envio" checked={e.id_envio === envio.id_envio} onChange={() => setEnvioId(e.id_envio)} />
                <span className="opcion-texto">
                  <span className="opcion-nombre">{e.nombre}</span>
                  {e.detalle && <span className="opcion-detalle">{e.detalle}</span>}
                </span>
                <span className="opcion-precio">{e.costo === 0 ? 'Gratis' : precio(e.costo)}</span>
              </label>
            ))}

            {envio.requiere_direccion && (
              <label className="etiqueta paso-direccion">
                Dirección de entrega
                <input
                  className="campo"
                  required
                  minLength={5}
                  maxLength={255}
                  autoComplete="street-address"
                  placeholder="Calle, número, localidad y código postal"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </label>
            )}
          </fieldset>

          <fieldset className="paso">
            <legend>Cómo querés pagar</legend>
            {mediosPago.map((m) => (
              <label key={m.codigo} className="opcion-radio">
                <input type="radio" name="pago" checked={m.codigo === pago.codigo} onChange={() => setPagoCodigo(m.codigo)} />
                <span className="opcion-texto">
                  <span className="opcion-nombre">{m.nombre}</span>
                  {m.detalle && <span className="opcion-detalle">{m.detalle}</span>}
                </span>
                {m.descuento_porcentaje > 0 && <span className="opcion-descuento">{m.descuento_porcentaje}% de descuento</span>}
              </label>
            ))}
            <p className="ayuda">
              {pago.codigo === 'mercadopago' && pagosOnline
                ? 'Al confirmar, te llevamos a Mercado Pago para que pagues de forma segura.'
                : 'Al confirmar, tu pedido queda pendiente de pago y la tienda se comunica con vos para coordinarlo.'}
            </p>
          </fieldset>
        </div>

        <aside className="resumen">
          <h2>Tu pedido</h2>
          <ul className="resumen-items">
            {items.map((i) => (
              <li key={i.id_variante}>
                <span className="carrito-color" style={{ backgroundColor: colorHex(i.color, i.color_hex) }} aria-hidden="true" />
                <span className="resumen-item-texto">
                  {i.cantidad} × {i.nombre}
                  <span className="carrito-variante">
                    Talle {i.talle}, {i.color}
                  </span>
                </span>
                <span>{precio(i.precio * i.cantidad)}</span>
              </li>
            ))}
          </ul>

          <p className="resumen-fila">
            <span>Productos</span>
            <span>{precio(subtotalCent / 100)}</span>
          </p>
          {descuentoCent > 0 && (
            <p className="resumen-fila">
              <span>Descuento ({pago.descuento_porcentaje}%)</span>
              <span>− {precio(descuentoCent / 100)}</span>
            </p>
          )}
          <p className="resumen-fila">
            <span>Envío</span>
            <span>{envioCent === 0 ? 'Gratis' : precio(envioCent / 100)}</span>
          </p>
          <p className="resumen-fila resumen-total">
            <span>Total</span>
            <strong>{precio(totalCent / 100)}</strong>
          </p>

          {error && (
            <p className="mensaje error" role="alert">
              {error}{' '}
              <Link to="/carrito" className="enlace">
                Revisar el carrito
              </Link>
            </p>
          )}

          <button type="submit" className="boton boton-ancho" disabled={enviando}>
            {enviando ? 'Confirmando…' : pago.codigo === 'mercadopago' && pagosOnline ? 'Confirmar y pagar' : 'Confirmar compra'}
          </button>
          <Link to="/carrito" className="enlace-boton">
            Volver al carrito
          </Link>
        </aside>
      </form>
    </section>
  );
}
