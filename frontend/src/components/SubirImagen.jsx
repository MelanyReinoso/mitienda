import { useRef, useState } from 'react';
import { subirImagen, urlImagen } from '../api.js';

const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 3;

// Elegir una imagen de la computadora, subirla y mostrar la vista previa.
// "valor" es la ruta guardada ('' si no hay); "onChange" recibe la ruta nueva ('' si se quitó).
export default function SubirImagen({ etiqueta, ayuda, valor, onChange, textoAlt = 'Vista previa' }) {
  const entrada = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  const elegir = async (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = ''; // así se puede volver a elegir el mismo archivo
    if (!archivo) return;

    setError('');
    if (!TIPOS.includes(archivo.type)) {
      setError('Elegí una imagen JPG, PNG o WebP.');
      return;
    }
    if (archivo.size > MAX_MB * 1024 * 1024) {
      setError(`La imagen pesa más de ${MAX_MB} MB. Probá con una más liviana.`);
      return;
    }

    setSubiendo(true);
    try {
      onChange(await subirImagen(archivo));
    } catch (e) {
      setError(e.message);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="subir">
      <span className="etiqueta-texto" id="subir-etiqueta">
        {etiqueta}
      </span>
      <div className="subir-cuerpo">
        <div className="subir-vista">
          {valor ? <img src={urlImagen(valor)} alt={textoAlt} /> : <span>Sin imagen</span>}
        </div>
        <div className="subir-acciones">
          <input ref={entrada} type="file" accept={TIPOS.join(',')} className="subir-input" aria-labelledby="subir-etiqueta" onChange={elegir} />
          <button type="button" className="boton boton-secundario" disabled={subiendo} onClick={() => entrada.current?.click()}>
            {subiendo ? 'Subiendo…' : valor ? 'Cambiar imagen' : 'Elegir imagen'}
          </button>
          {valor && !subiendo && (
            <button type="button" className="enlace-boton" onClick={() => onChange('')}>
              Quitar imagen
            </button>
          )}
        </div>
      </div>
      {ayuda && <span className="ayuda">{ayuda}</span>}
      {error && (
        <p className="mensaje error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
