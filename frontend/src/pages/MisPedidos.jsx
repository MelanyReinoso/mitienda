import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { ESTADOS_PEDIDO, fechaHora, precio } from '../utils/formato.js';

export default function MisPedidos() {
  const [estado, setEstado] = useState({ cargando: true, pedidos: [], error: '' });

  useEffect(() => {
    let cancelado = false;
    api('/pedidos/mios')
      .then((d) => !cancelado && setEstado({ cargando: false, pedidos: d.pedidos, error: '' }))
      .catch((e) => !cancelado && setEstado({ cargando: false, pedidos: [], error: e.message }));
    return () => {
      cancelado = true;
    };
  }, []);

  const { cargando, pedidos, error } = estado;

  return (
    <section>
      <h1 className="titulo-pagina">Mis pedidos</h1>

      {cargando && <p className="estado-vacio">Cargando tus pedidos…</p>}
      {error && (
        <p className="mensaje error" role="alert">
          {error}
        </p>
      )}

      {!cargando && !error && pedidos.length === 0 && (
        <>
          <p className="estado-vacio">Todavía no hiciste ningún pedido.</p>
          <Link to="/" className="boton">
            Ver el catálogo
          </Link>
        </>
      )}

      {pedidos.length > 0 && (
        <ul className="pedidos-lista">
          {pedidos.map((p) => (
            <li key={p.id_pedido}>
              <Link to={`/pedido/${p.id_pedido}`} className="pedido-fila">
                <span className="pedido-numero">Pedido #{p.id_pedido}</span>
                <span className={`estado estado-${p.estado}`}>{ESTADOS_PEDIDO[p.estado] ?? p.estado}</span>
                <span className="pedido-fecha">{fechaHora(p.creado_en)}</span>
                <span className="pedido-resumen">
                  {p.items.reduce((suma, i) => suma + i.cantidad, 0)} producto(s): {p.items.map((i) => i.nombre_producto).join(', ')}
                </span>
                <strong className="pedido-total">{precio(p.total)}</strong>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
