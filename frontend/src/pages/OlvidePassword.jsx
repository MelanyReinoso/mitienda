import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function OlvidePassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const datos = await api('/auth/olvide', { metodo: 'POST', cuerpo: { email } });
      setMensaje(datos.mensaje);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  if (mensaje) {
    return (
      <section className="formulario-pagina">
        <h1 className="titulo-pagina">Revisá tu email</h1>
        <p className="mensaje exito" role="status">
          {mensaje}
        </p>
        <Link to="/ingresar" className="enlace">
          Volver a ingresar
        </Link>
      </section>
    );
  }

  return (
    <section className="formulario-pagina">
      <h1 className="titulo-pagina">Recuperar contraseña</h1>
      <p className="formulario-intro">Escribí el email de tu cuenta y te enviamos un link para crear una contraseña nueva.</p>

      <form className="formulario" onSubmit={enviar}>
        <label className="etiqueta">
          Email
          <input className="campo" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        {error && (
          <p className="mensaje error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="boton boton-ancho" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar link'}
        </button>
      </form>

      <p className="formulario-pie">
        <Link to="/ingresar" className="enlace">
          Volver a ingresar
        </Link>
      </p>
    </section>
  );
}
