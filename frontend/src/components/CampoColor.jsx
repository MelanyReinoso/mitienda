import { urlImagen } from '../api.js';
import { colorHex, textoSobre } from '../utils/formato.js';

// Rectángulo que representa la prenda: se pinta del color elegido.
// Si el producto tiene foto, se muestra la foto; si no, se escribe el nombre sobre el color.
export default function CampoColor({ color, hex, nombre, imagen, grande = false }) {
  const fondo = colorHex(color, hex);

  return (
    <div
      className={grande ? 'campo-color campo-grande' : 'campo-color'}
      style={{ backgroundColor: fondo, color: textoSobre(fondo) }}
    >
      {imagen ? (
        <img src={urlImagen(imagen)} alt={nombre} loading="lazy" />
      ) : (
        <span className="campo-nombre">{nombre}</span>
      )}
    </div>
  );
}
