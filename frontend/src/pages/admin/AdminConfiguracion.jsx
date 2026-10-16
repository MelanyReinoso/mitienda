import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';
import Mensajes from '../../components/Mensajes.jsx';
import SubirImagen from '../../components/SubirImagen.jsx';
import { useAccion } from '../../hooks/useAccion.js';
import { useTienda } from '../../context/TiendaContext.jsx';
import CampoColor from '../../components/CampoColor.jsx';
import { ESQUINAS, GRILLAS, TEMAS, cargarFuentes, variablesDeTema } from '../../temas.js';
import { precio } from '../../utils/formato.js';

// ---------------------------------------------------------------- Datos de la tienda
function DatosTienda({ tienda, alGuardar }) {
  const [campos, setCampos] = useState({
    nombre: tienda.nombre,
    logo_url: tienda.logo_url || '',
    email_contacto: tienda.email_contacto || '',
    whatsapp: tienda.whatsapp || '',
    instagram: tienda.instagram || '',
    horario: tienda.horario || '',
  });
  const [estado, ejecutar] = useAccion();
  const cambiar = (e) => setCampos({ ...campos, [e.target.name]: e.target.value });

  const guardar = (evento) => {
    evento.preventDefault();
    ejecutar(async () => {
      await api('/tienda', { metodo: 'PUT', cuerpo: campos });
      await alGuardar();
    }, 'Guardaste los datos de la tienda.');
  };

  return (
    <section className="config-seccion" aria-labelledby="cfg-datos">
      <h2 id="cfg-datos">Datos de la tienda</h2>
      <p className="formulario-intro">Se ven en el menú, en el pie de página y en los emails. Los colores y el estilo se eligen en Apariencia.</p>

      <form className="formulario" onSubmit={guardar}>
        <label className="etiqueta">
          Nombre de la tienda
          <input className="campo" name="nombre" required minLength={2} maxLength={100} value={campos.nombre} onChange={cambiar} />
        </label>

        <SubirImagen
          etiqueta="Logo (opcional)"
          ayuda="Si no subís un logo, se muestra el nombre de la tienda. Conviene una imagen horizontal con fondo transparente (PNG), hasta 3 MB."
          valor={campos.logo_url}
          textoAlt="Vista previa del logo"
          onChange={(url) => setCampos({ ...campos, logo_url: url })}
        />

        <div className="formulario-grilla">
          <label className="etiqueta">
            Email de contacto
            <input className="campo" type="email" name="email_contacto" value={campos.email_contacto} onChange={cambiar} />
          </label>
          <label className="etiqueta">
            WhatsApp
            <input className="campo" type="tel" name="whatsapp" placeholder="5491100000000" value={campos.whatsapp} onChange={cambiar} />
            <span className="ayuda">Con código de país, sin + ni espacios.</span>
          </label>
          <label className="etiqueta">
            Instagram
            <input className="campo" name="instagram" placeholder="mitienda" value={campos.instagram} onChange={cambiar} />
            <span className="ayuda">Solo el usuario, sin @.</span>
          </label>
          <label className="etiqueta">
            Horario de atención
            <input className="campo" name="horario" maxLength={120} placeholder="Lunes a viernes de 9 a 18 h" value={campos.horario} onChange={cambiar} />
          </label>
        </div>

        <Mensajes estado={estado} />
        <button type="submit" className="boton" disabled={estado.ocupado}>
          {estado.ocupado ? 'Guardando…' : 'Guardar datos'}
        </button>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------- Apariencia
const PRENDAS_EJEMPLO = [
  { nombre: 'Remera', color: 'Crudo', precio: 18900 },
  { nombre: 'Jean', color: 'Azul', precio: 42500 },
  { nombre: 'Buzo', color: 'Negro', precio: 38000 },
];

function Apariencia({ tienda, alGuardar }) {
  const [campos, setCampos] = useState({
    tema: Object.hasOwn(TEMAS, tienda.tema) ? tienda.tema : 'clasico',
    color_principal: tienda.color_principal,
    esquinas: tienda.esquinas || '',
    grilla: tienda.grilla || '',
    aviso: tienda.aviso || '',
    portada_titulo: tienda.portada_titulo || '',
    portada_texto: tienda.portada_texto || '',
  });
  const [estado, ejecutar] = useAccion();
  const cambiar = (cambio) => setCampos((previos) => ({ ...previos, ...cambio }));

  // Para ver los modelos con su propia tipografía hay que tener sus fuentes cargadas
  useEffect(() => {
    Object.keys(TEMAS).forEach(cargarFuentes);
  }, []);

  const elegirModelo = (id) => cambiar({ tema: id, color_principal: TEMAS[id].color, esquinas: '' });

  const guardar = (evento) => {
    evento.preventDefault();
    ejecutar(async () => {
      await api('/tienda/apariencia', { metodo: 'PUT', cuerpo: campos });
      await alGuardar();
    }, 'Guardaste la apariencia de la tienda.');
  };

  const vista = variablesDeTema(campos);
  const grilla = campos.grilla || 'normal';

  return (
    <section className="config-seccion" aria-labelledby="cfg-apariencia">
      <h2 id="cfg-apariencia">Apariencia</h2>
      <p className="formulario-intro">Elegí un modelo de diseño y ajustalo a tu marca. Abajo ves cómo queda antes de guardar.</p>

      <form className="formulario" onSubmit={guardar}>
        <div role="group" aria-label="Modelo de diseño">
          <div className="modelos">
            {Object.entries(TEMAS).map(([id, t]) => {
              const v = variablesDeTema({ tema: id, color_principal: t.color });
              return (
                <button key={id} type="button" className="modelo" aria-pressed={campos.tema === id} onClick={() => elegirModelo(id)}>
                  <span className="modelo-muestra" style={{ ...v, background: v['--papel'], color: v['--tinta'] }}>
                    <span className="modelo-titulo" style={{ fontFamily: v['--fuente-titulo'], fontWeight: v['--titulo-peso'], textTransform: v['--titulo-caso'] }}>
                      {t.nombre}
                    </span>
                    <span className="modelo-colores" aria-hidden="true">
                      <span style={{ background: v['--lienzo'] }} />
                      <span style={{ background: v['--primario'] }} />
                      <span style={{ background: v['--tinta'] }} />
                    </span>
                  </span>
                  <span className="modelo-texto">
                    <span className="modelo-nombre">{t.nombre}</span>
                    <span className="modelo-descripcion">{t.descripcion}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="etiqueta">
          <label htmlFor="cfg-color">Color de la marca</label>
          <div className="campo-color-marca">
            <input id="cfg-color" type="color" value={campos.color_principal} onChange={(e) => cambiar({ color_principal: e.target.value })} />
            <code>{campos.color_principal}</code>
            <button type="button" className="enlace-boton" onClick={() => cambiar({ color_principal: TEMAS[campos.tema].color })}>
              Volver al color del modelo
            </button>
          </div>
          <span className="ayuda">Se usa en botones, filtros y enlaces. El texto se ajusta solo para que siempre se lea.</span>
        </div>

        <div className="formulario-grilla">
          <div className="etiqueta" role="group" aria-label="Esquinas">
            <span className="etiqueta-texto">Esquinas</span>
            <div className="opciones-segmento">
              <button type="button" className="chip" aria-pressed={campos.esquinas === ''} onClick={() => cambiar({ esquinas: '' })}>
                Las del modelo
              </button>
              {Object.entries(ESQUINAS).map(([id, e]) => (
                <button key={id} type="button" className="chip" aria-pressed={campos.esquinas === id} onClick={() => cambiar({ esquinas: id })}>
                  {e.nombre}
                </button>
              ))}
            </div>
          </div>
          <div className="etiqueta" role="group" aria-label="Tamaño de las prendas en el catálogo">
            <span className="etiqueta-texto">Prendas en el catálogo</span>
            <div className="opciones-segmento">
              {Object.entries(GRILLAS).map(([id, g]) => (
                <button key={id} type="button" className="chip" aria-pressed={grilla === id} title={g.ayuda} onClick={() => cambiar({ grilla: id })}>
                  {g.nombre}
                </button>
              ))}
            </div>
            <span className="ayuda">{GRILLAS[grilla].ayuda}.</span>
          </div>
        </div>

        <label className="etiqueta">
          Aviso arriba de todo (opcional)
          <input className="campo" maxLength={120} placeholder="Envío gratis en compras desde $50.000" value={campos.aviso} onChange={(e) => cambiar({ aviso: e.target.value })} />
        </label>
        <div className="formulario-grilla">
          <label className="etiqueta">
            Título de portada (opcional)
            <input className="campo" maxLength={80} placeholder="Nueva temporada" value={campos.portada_titulo} onChange={(e) => cambiar({ portada_titulo: e.target.value })} />
          </label>
          <label className="etiqueta">
            Texto de portada (opcional)
            <input className="campo" maxLength={200} placeholder="Prendas livianas para días largos." value={campos.portada_texto} onChange={(e) => cambiar({ portada_texto: e.target.value })} />
          </label>
        </div>

        <div>
          <span className="etiqueta-texto">Vista previa</span>
          <div className="preview-vista">
            <div className="preview" style={vista}>
              {campos.aviso.trim() && <p className="aviso-tienda">{campos.aviso.trim()}</p>}
              <div className="preview-barra">
                <span className="preview-marca">{tienda.nombre}</span>
                <span className="boton" aria-hidden="true">Carrito</span>
              </div>
              <div className="preview-cuerpo">
                {campos.portada_titulo.trim() && (
                  <div className="portada">
                    <h1>{campos.portada_titulo.trim()}</h1>
                    {campos.portada_texto.trim() && <p>{campos.portada_texto.trim()}</p>}
                  </div>
                )}
                <div className="preview-chips" aria-hidden="true">
                  <span className="chip" aria-pressed="true">Todo</span>
                  <span className="chip">Remeras</span>
                  <span className="chip">Pantalones</span>
                </div>
                <ul className="preview-grilla" aria-hidden="true">
                  {PRENDAS_EJEMPLO.map((p) => (
                    <li key={p.nombre}>
                      <CampoColor color={p.color} nombre={p.nombre} />
                      <div className="tarjeta-datos">
                        <span className="tarjeta-precio">{precio(p.precio)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Mensajes estado={estado} />
        <button type="submit" className="boton" disabled={estado.ocupado}>
          {estado.ocupado ? 'Guardando…' : 'Guardar apariencia'}
        </button>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------- Medios de pago
function MediosPago({ medios, alGuardar }) {
  const [filas, setFilas] = useState(medios);
  const [estado, ejecutar] = useAccion();

  const cambiar = (codigo, cambio) => setFilas(filas.map((f) => (f.codigo === codigo ? { ...f, ...cambio } : f)));

  const guardar = (evento) => {
    evento.preventDefault();
    const medios = filas.map((f) => ({
      codigo: f.codigo,
      nombre: f.nombre,
      detalle: f.detalle || '',
      descuento_porcentaje: Number(f.descuento_porcentaje),
      activo: f.activo,
    }));
    ejecutar(async () => {
      await api('/tienda/pagos', { metodo: 'PUT', cuerpo: { medios } });
      await alGuardar();
    }, 'Guardaste los medios de pago.');
  };

  return (
    <section className="config-seccion" aria-labelledby="cfg-pagos">
      <h2 id="cfg-pagos">Medios de pago</h2>
      <p className="formulario-intro">
        Los que estén activos se ofrecen al comprar. El descuento lo calcula el servidor sobre el valor de los productos, sin contar el envío.
      </p>

      <form onSubmit={guardar}>
        {filas.map((f) => (
          <div key={f.codigo} className="pago-fila">
            <label className="etiqueta-check">
              <input type="checkbox" checked={f.activo} onChange={(e) => cambiar(f.codigo, { activo: e.target.checked })} />
              Activo
            </label>
            <label className="etiqueta">
              Nombre
              <input className="campo" required maxLength={60} value={f.nombre} onChange={(e) => cambiar(f.codigo, { nombre: e.target.value })} />
            </label>
            <label className="etiqueta">
              Detalle (opcional)
              <input className="campo" maxLength={120} value={f.detalle || ''} onChange={(e) => cambiar(f.codigo, { detalle: e.target.value })} />
            </label>
            <label className="etiqueta">
              Descuento %
              <input
                className="campo"
                type="number"
                min="0"
                max="100"
                step="0.5"
                required
                value={f.descuento_porcentaje}
                onChange={(e) => cambiar(f.codigo, { descuento_porcentaje: e.target.value })}
              />
            </label>
          </div>
        ))}

        <Mensajes estado={estado} />
        <button type="submit" className="boton" disabled={estado.ocupado}>
          {estado.ocupado ? 'Guardando…' : 'Guardar medios de pago'}
        </button>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------- Métodos de envío
const ENVIO_VACIO = { nombre: '', detalle: '', costo: 0, requiere_direccion: true, activo: true };

function FormEnvio({ inicial, textoBoton, ocupado, onGuardar, onCancelar }) {
  const [campos, setCampos] = useState({ ...inicial, detalle: inicial.detalle || '' });
  const cambiar = (cambio) => setCampos({ ...campos, ...cambio });

  return (
    <form
      className="envio-formulario"
      onSubmit={(e) => {
        e.preventDefault();
        onGuardar({ ...campos, costo: Number(campos.costo) });
      }}
    >
      <div className="formulario-grilla">
        <label className="etiqueta">
          Nombre
          <input className="campo" required maxLength={80} value={campos.nombre} onChange={(e) => cambiar({ nombre: e.target.value })} />
        </label>
        <label className="etiqueta">
          Costo (0 = gratis)
          <input className="campo" type="number" min="0" step="0.01" required value={campos.costo} onChange={(e) => cambiar({ costo: e.target.value })} />
        </label>
      </div>
      <label className="etiqueta">
        Detalle (opcional)
        <input className="campo" maxLength={160} value={campos.detalle} onChange={(e) => cambiar({ detalle: e.target.value })} />
      </label>
      <label className="etiqueta-check">
        <input type="checkbox" checked={campos.requiere_direccion} onChange={(e) => cambiar({ requiere_direccion: e.target.checked })} />
        Pedir dirección de envío (desactivalo para retiro en el local)
      </label>
      <label className="etiqueta-check">
        <input type="checkbox" checked={campos.activo} onChange={(e) => cambiar({ activo: e.target.checked })} />
        Activo (se ofrece al comprar)
      </label>
      <div className="admin-acciones">
        <button type="submit" className="boton" disabled={ocupado}>
          {textoBoton}
        </button>
        {onCancelar && (
          <button type="button" className="enlace-boton" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

function Envios({ envios, alGuardar }) {
  const [estado, ejecutar] = useAccion();
  const [editando, setEditando] = useState(null); // id_envio
  const [eliminando, setEliminando] = useState(null);
  const [nuevoKey, setNuevoKey] = useState(0); // cambiar la key vacía el formulario de "agregar"

  const guardarEdicion = async (id, datos) => {
    const ok = await ejecutar(async () => {
      await api(`/tienda/envios/${id}`, { metodo: 'PUT', cuerpo: datos });
      await alGuardar();
    }, 'Guardaste el método de envío.');
    if (ok) setEditando(null);
  };

  const agregar = async (datos) => {
    const ok = await ejecutar(async () => {
      await api('/tienda/envios', { metodo: 'POST', cuerpo: datos });
      await alGuardar();
    }, 'Agregaste el método de envío.');
    if (ok) setNuevoKey(nuevoKey + 1);
  };

  const eliminar = async (e) => {
    const ok = await ejecutar(async () => {
      await api(`/tienda/envios/${e.id_envio}`, { metodo: 'DELETE' });
      await alGuardar();
    }, `Eliminaste "${e.nombre}".`);
    if (ok) setEliminando(null);
  };

  return (
    <section className="config-seccion" aria-labelledby="cfg-envios">
      <h2 id="cfg-envios">Métodos de envío</h2>
      <p className="formulario-intro">El costo se suma al total del pedido. Los pedidos ya hechos conservan el costo que tenían.</p>

      <Mensajes estado={estado} />

      <ul>
        {envios.map((e) => (
          <li key={e.id_envio} className="envio-fila">
            {editando === e.id_envio ? (
              <FormEnvio inicial={e} textoBoton="Guardar" ocupado={estado.ocupado} onGuardar={(d) => guardarEdicion(e.id_envio, d)} onCancelar={() => setEditando(null)} />
            ) : (
              <>
                <div className="envio-dato">
                  <span className="admin-nombre">
                    {e.nombre} <span className="etiqueta-inactiva">{e.activo ? '' : '(desactivado)'}</span>
                  </span>
                  <span className="admin-cuenta">
                    {e.costo === 0 ? 'Gratis' : precio(e.costo)}
                    {e.requiere_direccion ? ', pide dirección' : ', retiro sin dirección'}
                    {e.detalle ? `. ${e.detalle}` : ''}
                  </span>
                </div>

                {eliminando === e.id_envio ? (
                  <div className="admin-confirmar" role="group" aria-label={`Confirmar eliminar ${e.nombre}`}>
                    <span>¿Eliminar?</span>
                    <button type="button" className="boton boton-peligro" disabled={estado.ocupado} onClick={() => eliminar(e)}>
                      Sí, eliminar
                    </button>
                    <button type="button" className="enlace-boton" onClick={() => setEliminando(null)}>
                      No
                    </button>
                  </div>
                ) : (
                  <div className="admin-acciones">
                    <button type="button" className="enlace-boton" onClick={() => { setEditando(e.id_envio); setEliminando(null); }}>
                      Editar
                    </button>
                    <button type="button" className="enlace-boton" onClick={() => { setEliminando(e.id_envio); setEditando(null); }}>
                      Eliminar
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="envio-nuevo">
        <h3 className="footer-titulo">Agregar método de envío</h3>
        <FormEnvio key={nuevoKey} inicial={ENVIO_VACIO} textoBoton="Agregar" ocupado={estado.ocupado} onGuardar={agregar} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Página
export default function AdminConfiguracion() {
  const { recargar: recargarTienda } = useTienda();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      setConfig(await api('/tienda/admin'));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Después de guardar: se vuelve a leer todo, y el resto del sitio (menú, pie, colores) se actualiza al instante
  const alGuardar = useCallback(async () => {
    await Promise.all([cargar(), recargarTienda()]);
  }, [cargar, recargarTienda]);

  if (error && !config) {
    return (
      <p className="mensaje error" role="alert">
        {error}
      </p>
    );
  }
  if (!config) return <p className="estado-vacio">Cargando configuración…</p>;

  return (
    <section>
      <h1 className="titulo-pagina">Configuración</h1>
      <div className="config config-ancho">
        <Apariencia tienda={config.tienda} alGuardar={alGuardar} />
        <DatosTienda tienda={config.tienda} alGuardar={alGuardar} />
        <MediosPago medios={config.medios_pago} alGuardar={alGuardar} />
        <Envios envios={config.metodos_envio} alGuardar={alGuardar} />
      </div>
    </section>
  );
}
