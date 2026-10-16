import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { rutaInterna } from '../utils/formato.js';

export default function Ingresar() {
  const { ingresar } = useAuth();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const volver = rutaInterna(params.get('volver'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await ingresar(email, password);
      navegar(volver, { replace: true });
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  };

  return (
    <section className="formulario-pagina">
      <h1 className="titulo-pagina">Ingresar</h1>

      <form className="formulario" onSubmit={enviar}>
        <label className="etiqueta">
          Email
          <input className="campo" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label className="etiqueta">
          Contraseña
          <input
            className="campo"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <p className="mensaje error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="boton boton-ancho" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <p className="formulario-pie">
        <Link to="/olvide" className="enlace">
          Olvidé mi contraseña
        </Link>
      </p>

      <p className="formulario-pie">
        ¿Todavía no tenés cuenta?{' '}
        <Link to={`/registro?volver=${encodeURIComponent(volver)}`} className="enlace">
          Crear cuenta
        </Link>
      </p>
    </section>
  );
}
