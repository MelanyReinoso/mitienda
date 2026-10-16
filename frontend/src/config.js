// Ya no hay que editar nada acá: el nombre, el logo, el color, el contacto, los medios de pago
// y los envíos se cambian desde la tienda, entrando como admin → "Configuración".
// Estos son solo los valores que se muestran un instante mientras carga la tienda, o si la API no responde.
export const TIENDA_POR_DEFECTO = {
  tienda: {
    nombre: 'Mi Tienda',
    slug: '',
    logo_url: null,
    color_principal: '#1d4b3a',
    tema: 'clasico',
    esquinas: null,
    grilla: null,
    aviso: null,
    portada_titulo: null,
    portada_texto: null,
    email_contacto: null,
    whatsapp: null,
    instagram: null,
    horario: null,
  },
  pagos_online: false,
  medios_pago: [],
  metodos_envio: [],
};
