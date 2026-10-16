import { Link } from 'react-router-dom';
import CampoColor from './CampoColor.jsx';
import { colorHex, coloresDe, precio } from '../utils/formato.js';

export default function TarjetaProducto({ producto }) {
  const colores = coloresDe(producto.variantes);
  const agotado = producto.stock_total === 0;
  // Mostramos el primer color que todavía tenga stock
  const principal = colores.find((c) => producto.variantes.some((v) => v.color === c.color && v.stock > 0)) ?? colores[0];

  return (
    <li className={agotado ? 'tarjeta agotada' : 'tarjeta'}>
      <Link to={`/producto/${producto.id_producto}`} className="tarjeta-enlace">
        <CampoColor color={principal?.color ?? 'Gris'} hex={principal?.hex} nombre={producto.nombre} imagen={producto.imagen_url} />

        <div className="tarjeta-datos">
          {producto.imagen_url && <span className="tarjeta-nombre">{producto.nombre}</span>}
          <span className="tarjeta-precio">
            {agotado ? 'Sin stock' : producto.variantes.length > 1 ? `Desde ${precio(producto.precio_desde)}` : precio(producto.precio_desde)}
          </span>
          <span className="muestras" aria-label={`Colores: ${colores.map((c) => c.color).join(', ')}`}>
            {colores.map((c) => (
              <span key={c.color} className="muestra" style={{ backgroundColor: colorHex(c.color, c.hex) }} title={c.color} />
            ))}
          </span>
        </div>
      </Link>
    </li>
  );
}
