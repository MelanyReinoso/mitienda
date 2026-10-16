import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useTienda } from '../context/TiendaContext.jsx';
import { ESTADOS_PEDIDO, NOMBRE_PAGO, fechaHora, precio, urlMercadoPago } from '../utils/formato.js';

export default function PedidoDetalle() {
  const { id } = useParams();
  const { state } = useLocation();
  const { tienda, pagosOnline } = useTienda();
  const [params] = useSearchParams();
  const vuelta = params.get('pago'); // ok / pendiente / error: lo agrega Mercado Pago al volver a la tienda
  const [estado, setEstado] = useState({ cargando: true, pedido: null, error: '' });
  const [pagando, setPagando] = useState({ ocupado: false, error: '' });
  const [confirmando, setConfirmando] = useState(Boolean(vuelta) && vuelta !== 'error');

  const cargar = useCallback(() => api(`/pedidos/${id}`), [id]);

  useEffect(() => {
    let cancelado = false;
    setEstado({ cargando: true, pedido: null, error: '' });
    cargar()
      .then((d) => !cancelado && setEstado({ cargando: false, pedido: d.pedido, error: '' }))
      .catch((e) => !cancelado && setEstado({ cargando: false, pedido: null, error: e.message }));
    return () => {
      cancelado = true;
    };
  }, [id, cargar]);

  // Al volver de Mercado Pago: se le pregunta si el pago ya se acreditó (unas cuantas veces, por si tarda unos segundos)
  useEffect(() => {
    if (!confirmando) return undefined;
    let cancelado = false;
    let intentos = 0;
    const consultar = async () => {
      intentos += 1;
      let estadoPago = 'pendiente';
      try {
        estadoPago = (await api(`/pedidos/${id}/verificar-pago`, { metodo: 'POST' })).estado;
        const d = await cargar();
        if (!cancelado) setEstado({ cargando: false, pedido: d.pedido, error: '' });
      } catch {
        // si falla, se reintenta
      }
      if (cancelado) return;
      if (estadoPago !== 'pendiente' || intentos >= 6) setConfirmando(false);
      else temporizador = setTimeout(consultar, 4000);
    };
    let temporizador = setTimeout(consultar, 500);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [confirmando, id, cargar]);

  // "Ya pagué": le pregunta a Mercado Pago si el pago se acreditó (por si el cliente no volvió por el link)
  const [revisando, setRevisando] = useState({ ocupado: false, aviso: '' });
  const revisar = async () => {
    setRevisando({ ocupado: true, aviso: '' });
    try {
      const { estado: nuevo } = await api(`/pedidos/${id}/verificar-pago`, { metodo: 'POST' });
      const d = await cargar();
      setEstado({ cargando: false, pedido: d.pedido, error: '' });
      setRevisando({ ocupado: false, aviso: nuevo === 'pendiente' ? 'Mercado Pago todavía no confirmó ningún pago de este pedido.' : '' });
    } catch (e) {
      setRevisando({ ocupado: false, aviso: e.message });
    }
  };

  const pagar = async () => {
    setPagando({ ocupado: true, error: '' });
    try {
      const { url } = await api(`/pedidos/${id}/pagar-mp`, { metodo: 'POST' });
      if (!urlMercadoPago(url)) throw new Error('No pudimos abrir Mercado Pago. Probá de nuevo.');
      window.location.assign(url);
    } catch (e) {
      setPagando({ ocupado: false, error: e.message });
    }
  };

  const { cargando, pedido, error } = estado;

  if (cargando) return <p className="estado-vacio">Cargando el pedido…</p>;
  if (error) {
    return (
      <section>
        <p className="mensaje error" role="alert">
          {error}
        </p>
        <Link to="/mis-pedidos" className="enlace">
          Ir a mis pedidos
        </Link>
      </section>
    );
  }

  const contacto = [tienda.whatsapp && `WhatsApp +${tienda.whatsapp}`, tienda.email_contacto].filter(Boolean).join(' o ');
  const mostrarDireccion = pedido.direccion_envio && pedido.direccion_envio !== pedido.envio_nombre;

  return (
    <section>
      {vuelta && (
        <div className={pedido.estado === 'pagado' ? 'mensaje exito' : 'mensaje'} role="status">
          {pedido.estado === 'pagado' && <strong>¡Pago recibido!</strong>}
          {pedido.estado === 'pagado' && ' Ya estamos preparando tu pedido.'}
          {pedido.estado === 'pendiente' && confirmando && 'Estamos confirmando tu pago con Mercado Pago…'}
          {pedido.estado === 'pendiente' && !confirmando && vuelta === 'error' && 'El pago no se completó. Podés intentarlo de nuevo con el botón de abajo.'}
          {pedido.estado === 'pendiente' && !confirmando && vuelta !== 'error' && 'Todavía no recibimos la confirmación del pago. Si ya pagaste, puede tardar unos minutos en verse acá.'}
        </div>
      )}

      {state?.nuevo && !vuelta && (
        <div className="mensaje exito" role="status">
          <strong>¡Gracias por tu compra!</strong> Recibimos tu pedido. Queda pendiente de pago y la tienda se comunica con vos para coordinarlo
          {contacto ? `. Si querés escribirnos: ${contacto}.` : '.'}
        </div>
      )}

      <h1 className="titulo-pagina">Pedido #{pedido.id_pedido}</h1>
      <p className="pedido-cabecera">
        <span className={`estado estado-${pedido.estado}`}>{ESTADOS_PEDIDO[pedido.estado] ?? pedido.estado}</span>
        <span>{fechaHora(pedido.creado_en)}</span>
      </p>

      <div className="carrito">
        <ul className="carrito-lista">
          {pedido.items.map((i) => (
            <li key={`${i.id_variante}-${i.talle}-${i.color}`} className="pedido-item">
              <span className="carrito-detalle">
                <span className="carrito-nombre-plano">{i.nombre_producto}</span>
                <span className="carrito-variante">
                  Talle {i.talle}, {i.color}. {precio(i.precio_unitario)} c/u
                </span>
              </span>
              <span>× {i.cantidad}</span>
              <span className="carrito-total">{precio(i.precio_unitario * i.cantidad)}</span>
            </li>
          ))}
        </ul>

        <aside className="resumen">
          <h2>Detalle</h2>
          <p className="resumen-fila">
            <span>Productos</span>
            <span>{precio(pedido.subtotal)}</span>
          </p>
          {pedido.descuento > 0 && (
            <p className="resumen-fila">
              <span>Descuento</span>
              <span>− {precio(pedido.descuento)}</span>
            </p>
          )}
          <p className="resumen-fila">
            <span>Envío</span>
            <span>{pedido.costo_envio === 0 ? 'Gratis' : precio(pedido.costo_envio)}</span>
          </p>
          <p className="resumen-fila resumen-total">
            <span>Total</span>
            <strong>{precio(pedido.total)}</strong>
          </p>

          <dl className="resumen-datos">
            <dt>Pago</dt>
            <dd>{NOMBRE_PAGO[pedido.metodo_pago] ?? pedido.metodo_pago}</dd>
            <dt>Entrega</dt>
            <dd>
              {pedido.envio_nombre ?? 'Envío'}
              {mostrarDireccion && <span className="carrito-variante">{pedido.direccion_envio}</span>}
            </dd>
          </dl>
        </aside>
      </div>

      {pedido.estado === 'pendiente' && pedido.metodo_pago === 'mercadopago' && pagosOnline && (
        <div className="pedido-pagar">
          <button type="button" className="boton" disabled={pagando.ocupado} onClick={pagar}>
            {pagando.ocupado ? 'Abriendo Mercado Pago…' : 'Pagar con Mercado Pago'}
          </button>
          <button type="button" className="enlace-boton" disabled={revisando.ocupado} onClick={revisar}>
            {revisando.ocupado ? 'Consultando…' : 'Ya pagué: revisar el pago'}
          </button>
          {revisando.aviso && <p className="aviso" role="status">{revisando.aviso}</p>}
          {pagando.error && (
            <p className="mensaje error" role="alert">
              {pagando.error}
            </p>
          )}
        </div>
      )}

      <p className="formulario-pie">
        <Link to="/mis-pedidos" className="enlace">
          Volver a mis pedidos
        </Link>
      </p>
    </section>
  );
}
