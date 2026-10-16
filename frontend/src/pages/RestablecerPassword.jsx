import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';

export default function RestablecerPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (!token) {
    return (
      <section className="formulario-pagina">
        <h1 className="titulo-pagina">Link incompleto</h1>
        <p className="mensaje error" role="alert">
          Este link no tiene el código para cambiar la contraseña. Pedí uno nuevo.
        </p>
        <Link to="/olvide" className="enlace">
          Pedir un link nuevo
        </Link>
      </section>
    );
  }

  if (listo) {
    return (
      <section className="formulario-pagina">
        <h1 className="titulo-pagina">Contraseña cambiada</h1>
        <p className="mensaje exito" role="status">
          Listo, ya podés ingresar con tu contraseña nueva.
        </p>
        <Link to="/ingresar" className="boton">
          Ingresar
        </Link>
      </section>
    );
  }

  const enviar = async (evento) => {
    evento.preventDefault();
    setError('');
    if (password !== repetida) {
      setError('Las dos contraseñas no coinciden.');
      return;
    }
    setEnviando(true);
    try {
      await api('/auth/restablecer', { metodo: 'POST', cuerpo: { token, password } });
      setListo(true);
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  };

  return (
    <section className="formulario-pagina">
      <h1 className="titulo-pagina">Contraseña nueva</h1>

      <form className="formulario" onSubmit={enviar}>
        <label className="etiqueta">
          Contraseña nueva
          <input
            className="campo"
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="ayuda">Mínimo 8 caracteres.</span>
        </label>

        <label className="etiqueta">
          Repetí la contraseña
          <input
            className="campo"
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
          />
        </label>

        {error && (
          <p className="mensaje error" role="alert">
            {error}{' '}
            {/venció|válido/.test(error) && (
              <Link to="/olvide" className="enlace">
                Pedir un link nuevo
              </Link>
            )}
          </p>
        )}

        <button type="submit" className="boton boton-ancho" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </section>
  );
}
