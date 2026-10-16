import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';
import Mensajes from '../../components/Mensajes.jsx';
import { useAccion } from '../../hooks/useAccion.js';
import { ACCION_PEDIDO, ESTADOS_PEDIDO, NOMBRE_PAGO, TRANSICIONES_PEDIDO, fechaHora, precio } from '../../utils/formato.js';

const FILTROS = ['', ...Object.keys(ESTADOS_PEDIDO)];

function Resumen({ datos }) {
  if (!datos) return null;
  const { por_estado: e } = datos;
  return (
    <dl className="ventas-resumen">
      <div>
        <dt>Vendido en los últimos 30 días</dt>
        <dd>{precio(datos.vendido_30_dias)}</dd>
      </div>
      <div>
        <dt>Vendido en total</dt>
        <dd>{precio(datos.vendido)}</dd>
      </div>
      <div>
        <dt>Por cobrar ({e.pendiente.cantidad} pendientes)</dt>
        <dd>{precio(datos.por_cobrar)}</dd>
      </div>
      <div>
        <dt>Para preparar o enviar</dt>
        <dd>{e.pagado.cantidad + e.preparando.cantidad}</dd>
      </div>
    </dl>
  );
}

function Pedido({ pedido, ocupado, onCambiar }) {
  const [abierto, setAbierto] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const siguientes = TRANSICIONES_PEDIDO[pedido.estado] ?? [];
  const avances = siguientes.filter((s) => s !== 'cancelado');
  const puedeCancelar = siguientes.includes('cancelado');

  return (
    <li className="venta">
      <div className="venta-cabecera">
        <button type="button" className="venta-titulo" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
          <span className="pedido-numero">Pedido #{pedido.id_pedido}</span>
          <span className="admin-cuenta">
            {pedido.cliente} · {fechaHora(pedido.creado_en)}
          </span>
        </button>
        <span className={`estado estado-${pedido.estado}`}>{ESTADOS_PEDIDO[pedido.estado] ?? pedido.estado}</span>
        <strong className="venta-total">{precio(pedido.total)}</strong>
      </div>

      {abierto && (
        <div className="venta-detalle">
          <ul>
            {pedido.items.map((i) => (
              <li key={`${i.id_variante}-${i.talle}-${i.color}`}>
                {i.cantidad} × {i.nombre_producto}, talle {i.talle}, {i.color} ({precio(i.precio_unitario)} c/u)
              </li>
            ))}
          </ul>
          <dl className="resumen-datos">
            <dt>Cliente</dt>
            <dd>
              {pedido.cliente}
              <a className="enlace" href={`mailto:${pedido.cliente_email}`}>
                {pedido.cliente_email}
              </a>
            </dd>
            <dt>Pago</dt>
            <dd>{NOMBRE_PAGO[pedido.metodo_pago] ?? pedido.metodo_pago}</dd>
            <dt>Entrega</dt>
            <dd>
              {pedido.envio_nombre ?? 'Envío'}
              {pedido.direccion_envio && pedido.direccion_envio !== pedido.envio_nombre && (
                <span className="carrito-variante">{pedido.direccion_envio}</span>
              )}
            </dd>
            <dt>Importes</dt>
            <dd>
              Productos {precio(pedido.subtotal)}
              {pedido.descuento > 0 && <span className="carrito-variante">Descuento − {precio(pedido.descuento)}</span>}
              <span className="carrito-variante">Envío {pedido.costo_envio === 0 ? 'gratis' : precio(pedido.costo_envio)}</span>
            </dd>
          </dl>

          {(avances.length > 0 || puedeCancelar) &&
            (cancelando ? (
              <div className="admin-confirmar" role="group" aria-label={`Confirmar cancelar el pedido ${pedido.id_pedido}`}>
                <span>Se cancela el pedido y el stock vuelve a las prendas. ¿Seguro?</span>
                <button type="button" className="boton boton-peligro" disabled={ocupado} onClick={() => onCambiar(pedido, 'cancelado')}>
                  Sí, cancelar
                </button>
                <button type="button" className="enlace-boton" onClick={() => setCancelando(false)}>
                  No
                </button>
              </div>
            ) : (
              <div className="admin-acciones">
                {avances.map((s) => (
                  <button key={s} type="button" className="boton" disabled={ocupado} onClick={() => onCambiar(pedido, s)}>
                    {ACCION_PEDIDO[s]}
                  </button>
                ))}
                {puedeCancelar && (
                  <button type="button" className="enlace-boton" onClick={() => setCancelando(true)}>
                    {ACCION_PEDIDO.cancelado}
                  </button>
                )}
              </div>
            ))}
        </div>
      )}
    </li>
  );
}

export default function AdminPedidos() {
  const [filtro, setFiltro] = useState('');
  const [datos, setDatos] = useState({ cargando: true, pedidos: [], error: '' });
  const [resumen, setResumen] = useState(null);
  const [estado, ejecutar] = useAccion();

  const cargar = useCallback(async () => {
    try {
      const [lista, res] = await Promise.all([api(`/pedidos${filtro ? `?estado=${filtro}` : ''}`), api('/pedidos/resumen')]);
      setDatos({ cargando: false, pedidos: lista.pedidos, error: '' });
      setResumen(res);
    } catch (e) {
      setDatos((previos) => ({ ...previos, cargando: false, error: e.message }));
    }
  }, [filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiar = (pedido, nuevo) =>
    ejecutar(async () => {
      await api(`/pedidos/${pedido.id_pedido}/estado`, { metodo: 'PUT', cuerpo: { estado: nuevo } });
      await cargar();
    }, `El pedido #${pedido.id_pedido} pasó a "${ESTADOS_PEDIDO[nuevo]}".`);

  return (
    <section>
      <h1 className="titulo-pagina">Ventas</h1>
      <Resumen datos={resumen} />

      <div className="categorias" role="group" aria-label="Filtrar por estado">
        {FILTROS.map((f) => (
          <button key={f || 'todos'} type="button" className="chip" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
            {f ? ESTADOS_PEDIDO[f] : 'Todos'}
            {f && resumen ? ` (${resumen.por_estado[f].cantidad})` : ''}
          </button>
        ))}
      </div>

      <Mensajes estado={estado} />
      {datos.error && (
        <p className="mensaje error" role="alert">
          {datos.error}
        </p>
      )}
      {datos.cargando && <p className="estado-vacio">Cargando pedidos…</p>}
      {!datos.cargando && !datos.error && datos.pedidos.length === 0 && (
        <p className="estado-vacio">{filtro ? 'No hay pedidos en este estado.' : 'Todavía no hay pedidos. Cuando alguien compre, aparece acá.'}</p>
      )}

      <ul className="ventas-lista">
        {datos.pedidos.map((p) => (
          <Pedido key={p.id_pedido} pedido={p} ocupado={estado.ocupado} onCambiar={cambiar} />
        ))}
      </ul>
    </section>
  );
}
