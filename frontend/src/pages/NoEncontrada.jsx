import { Link } from 'react-router-dom';

export default function NoEncontrada() {
  return (
    <section>
      <h1 className="titulo-pagina">No encontramos esa página</h1>
      <p className="estado-vacio">El link puede estar mal escrito o la página ya no existe.</p>
      <Link to="/" className="boton">
        Ir al catálogo
      </Link>
    </section>
  );
}
