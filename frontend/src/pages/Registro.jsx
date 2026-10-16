import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { rutaInterna } from '../utils/formato.js';

export default function Registro() {
  const { registrarse } = useAuth();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const volver = rutaInterna(params.get('volver'));

  const [campos, setCampos] = useState({ nombre: '', apellido: '', email: '', telefono: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Un solo "cambiar" para todos los campos: usa el atributo name de cada input
  const cambiar = (evento) => setCampos({ ...campos, [evento.target.name]: evento.target.value });

  const enviar = async (evento) => {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await registrarse(campos);
      navegar(volver, { replace: true });
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  };

  return (
    <section className="formulario-pagina">
      <h1 className="titulo-pagina">Crear cuenta</h1>

      <form className="formulario" onSubmit={enviar}>
        <div className="formulario-doble">
          <label className="etiqueta">
            Nombre
            <input className="campo" name="nombre" required autoComplete="given-name" value={campos.nombre} onChange={cambiar} />
          </label>
          <label className="etiqueta">
            Apellido
            <input className="campo" name="apellido" required autoComplete="family-name" value={campos.apellido} onChange={cambiar} />
          </label>
        </div>

        <label className="etiqueta">
          Email
          <input className="campo" type="email" name="email" required autoComplete="email" value={campos.email} onChange={cambiar} />
        </label>

        <label className="etiqueta">
          Teléfono (opcional)
          <input className="campo" type="tel" name="telefono" autoComplete="tel" value={campos.telefono} onChange={cambiar} />
        </label>

        <label className="etiqueta">
          Contraseña
          <input
            className="campo"
            type="password"
            name="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            value={campos.password}
            onChange={cambiar}
          />
          <span className="ayuda">Mínimo 8 caracteres.</span>
        </label>

        {error && (
          <p className="mensaje error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="boton boton-ancho" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="formulario-pie">
        ¿Ya tenés cuenta?{' '}
        <Link to={`/ingresar?volver=${encodeURIComponent(volver)}`} className="enlace">
          Ingresar
        </Link>
      </p>
    </section>
  );
}
