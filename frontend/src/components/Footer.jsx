import { useTienda } from '../context/TiendaContext.jsx';

export default function Footer() {
  const { tienda, mediosPago, metodosEnvio } = useTienda();
  const hayContacto = tienda.email_contacto || tienda.whatsapp || tienda.instagram || tienda.horario;

  return (
    <footer className="footer">
      <div className="contenedor">
        <div className="footer-columnas">
          {hayContacto && (
            <section aria-labelledby="footer-contacto">
              <h2 id="footer-contacto" className="footer-titulo">
                Contacto
              </h2>
              <ul className="footer-lista">
                {tienda.email_contacto && (
                  <li>
                    <a href={`mailto:${tienda.email_contacto}`}>{tienda.email_contacto}</a>
                  </li>
                )}
                {tienda.whatsapp && (
                  <li>
                    <a href={`https://wa.me/${tienda.whatsapp}`} target="_blank" rel="noopener noreferrer">
                      WhatsApp +{tienda.whatsapp}
                    </a>
                  </li>
                )}
                {tienda.instagram && (
                  <li>
                    <a href={`https://instagram.com/${tienda.instagram}`} target="_blank" rel="noopener noreferrer">
                      Instagram @{tienda.instagram}
                    </a>
                  </li>
                )}
                {tienda.horario && <li>{tienda.horario}</li>}
              </ul>
            </section>
          )}

          {mediosPago.length > 0 && (
            <section aria-labelledby="footer-pagos">
              <h2 id="footer-pagos" className="footer-titulo">
                Medios de pago
              </h2>
              <ul className="footer-lista">
                {mediosPago.map((m) => (
                  <li key={m.codigo}>
                    {m.nombre}
                    {m.detalle && <span className="footer-detalle">{m.detalle}</span>}
                    {m.descuento_porcentaje > 0 && (
                      <span className="footer-descuento">{m.descuento_porcentaje}% de descuento</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {metodosEnvio.length > 0 && (
            <section aria-labelledby="footer-envios">
              <h2 id="footer-envios" className="footer-titulo">
                Envíos
              </h2>
              <ul className="footer-lista">
                {metodosEnvio.map((e) => (
                  <li key={e.id_envio}>
                    {e.nombre}
                    {e.detalle && <span className="footer-detalle">{e.detalle}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <p className="footer-copy">
          © {new Date().getFullYear()} {tienda.nombre}
        </p>
      </div>
    </footer>
  );
}
