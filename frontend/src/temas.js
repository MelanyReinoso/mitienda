// Modelos de diseño de la tienda. Los ids tienen que coincidir con backend/src/utils/temas.js.
// Cada modelo define TODOS los valores, así al cambiar de uno a otro no queda nada del anterior.
import { marcaComoTexto, textoSobreMarca } from './utils/formato.js';

export const TEMAS = {
  clasico: {
    nombre: 'Clásico',
    descripcion: 'Verde botella sobre fondo claro. Prolijo y versátil, sirve para cualquier marca.',
    color: '#1d4b3a',
    esquinas: 'suaves',
    fuentes: null, // ya se cargan desde index.html
    v: {
      papel: '#e9ebe6', lienzo: '#f7f7f3', tinta: '#1c2421', 'tinta-suave': '#5a645f', linea: '#cfd3cc', borde: '#9ea69f',
      'deshab-fondo': '#b9c0ba', 'deshab-texto': '#5e675f', error: '#9b2c2c', 'error-fondo': '#f6e4e1',
      'fuente-titulo': "'Bricolage Grotesque', system-ui, sans-serif", 'fuente-texto': "'Hanken Grotesk', system-ui, sans-serif",
      'titulo-peso': '800', 'titulo-espacio': '-0.02em', 'titulo-caso': 'none', 'foto-aspecto': '4 / 5', 'portada-alineo': 'left',
    },
  },
  minimal: {
    nombre: 'Minimal',
    descripcion: 'Blanco, tipografía liviana y esquinas rectas. La ropa es la protagonista.',
    color: '#161616',
    esquinas: 'rectas',
    fuentes: 'family=Jost:wght@400;500;600&family=Figtree:wght@400;500;700',
    v: {
      papel: '#ffffff', lienzo: '#f5f5f4', tinta: '#161616', 'tinta-suave': '#666666', linea: '#e3e3e1', borde: '#8a8a8a',
      'deshab-fondo': '#dcdcda', 'deshab-texto': '#6b6b6b', error: '#a12626', 'error-fondo': '#f8e3e1',
      'fuente-titulo': "'Jost', system-ui, sans-serif", 'fuente-texto': "'Figtree', system-ui, sans-serif",
      'titulo-peso': '500', 'titulo-espacio': '-0.01em', 'titulo-caso': 'none', 'foto-aspecto': '3 / 4', 'portada-alineo': 'left',
    },
  },
  urbano: {
    nombre: 'Urbano',
    descripcion: 'Fondo oscuro y títulos compactos en mayúsculas. Pensado para streetwear y ropa joven.',
    color: '#8b7bff',
    esquinas: 'rectas',
    fuentes: 'family=Anton&family=Archivo:wght@400;500;700',
    v: {
      papel: '#0f0f10', lienzo: '#1a1a1c', tinta: '#f1f0ec', 'tinta-suave': '#a4a39d', linea: '#34343a', borde: '#6d6d77',
      'deshab-fondo': '#2b2b30', 'deshab-texto': '#8a8a93', error: '#ff958b', 'error-fondo': '#3a1d1d',
      'fuente-titulo': "'Anton', Impact, system-ui, sans-serif", 'fuente-texto': "'Archivo', system-ui, sans-serif",
      'titulo-peso': '400', 'titulo-espacio': '0.01em', 'titulo-caso': 'uppercase', 'foto-aspecto': '3 / 4', 'portada-alineo': 'left',
    },
  },
  boutique: {
    nombre: 'Boutique',
    descripcion: 'Rosados suaves, títulos con serif y formas redondeadas. Para moda femenina y de autor.',
    color: '#9d3b5b',
    esquinas: 'redondas',
    fuentes: 'family=Fraunces:opsz,wght@9..144,500;9..144,700&family=DM+Sans:wght@400;500;700',
    v: {
      papel: '#f3e8ea', lienzo: '#fbf5f6', tinta: '#35202a', 'tinta-suave': '#765a65', linea: '#e3d0d6', borde: '#a38690',
      'deshab-fondo': '#dccbd0', 'deshab-texto': '#765d67', error: '#a3263f', 'error-fondo': '#f8dde2',
      'fuente-titulo': "'Fraunces', Georgia, serif", 'fuente-texto': "'DM Sans', system-ui, sans-serif",
      'titulo-peso': '700', 'titulo-espacio': '-0.015em', 'titulo-caso': 'none', 'foto-aspecto': '4 / 5', 'portada-alineo': 'center',
    },
  },
  fresco: {
    nombre: 'Fresco',
    descripcion: 'Celestes, fotos cuadradas y formas amables. Ideal para ropa deportiva, de playa o infantil.',
    color: '#0a64b5',
    esquinas: 'redondas',
    fuentes: 'family=Sora:wght@600;700;800&family=Nunito+Sans:wght@400;600;700',
    v: {
      papel: '#e4eff4', lienzo: '#f6fafc', tinta: '#0f2a38', 'tinta-suave': '#4b6575', linea: '#c3d6df', borde: '#7d9aaa',
      'deshab-fondo': '#b8cad3', 'deshab-texto': '#4d6677', error: '#a02c2c', 'error-fondo': '#f6e1e1',
      'fuente-titulo': "'Sora', system-ui, sans-serif", 'fuente-texto': "'Nunito Sans', system-ui, sans-serif",
      'titulo-peso': '700', 'titulo-espacio': '-0.03em', 'titulo-caso': 'none', 'foto-aspecto': '1 / 1', 'portada-alineo': 'left',
    },
  },
};

export const ESQUINAS = {
  rectas: { nombre: 'Rectas', v: { radio: '0px', 'radio-boton': '0px', 'radio-foto': '0px', 'radio-chip': '0px' } },
  suaves: { nombre: 'Suaves', v: { radio: '6px', 'radio-boton': '6px', 'radio-foto': '4px', 'radio-chip': '999px' } },
  redondas: { nombre: 'Redondas', v: { radio: '16px', 'radio-boton': '999px', 'radio-foto': '18px', 'radio-chip': '999px' } },
};

export const GRILLAS = {
  amplia: { nombre: 'Amplia', ayuda: 'Pocas prendas por fila, fotos grandes', v: { 'grilla-min': '280px' } },
  normal: { nombre: 'Normal', ayuda: 'Equilibrada', v: { 'grilla-min': '220px' } },
  compacta: { nombre: 'Compacta', ayuda: 'Más prendas a la vista', v: { 'grilla-min': '168px' } },
};

const temaDe = (id) => (Object.hasOwn(TEMAS, id) ? TEMAS[id] : TEMAS.clasico);

// Todas las variables CSS que resultan de la configuración de la tienda: modelo + ajustes + color.
// Sirve tanto para pintar toda la página como para la vista previa dentro de Configuración.
export const variablesDeTema = ({ tema, esquinas, grilla, color_principal: color }) => {
  const t = temaDe(tema);
  const e = Object.hasOwn(ESQUINAS, esquinas) ? ESQUINAS[esquinas] : ESQUINAS[t.esquinas];
  const g = Object.hasOwn(GRILLAS, grilla) ? GRILLAS[grilla] : GRILLAS.normal;
  const marca = /^#[0-9a-f]{6}$/i.test(color || '') ? color : t.color;

  const vars = {
    ...t.v,
    ...e.v,
    ...g.v,
    'portada-flex': t.v['portada-alineo'] === 'center' ? 'center' : 'flex-start',
    primario: marca,
    'sobre-primario': textoSobreMarca(marca),
    'primario-texto': marcaComoTexto(marca, t.v.lienzo),
  };
  return Object.fromEntries(Object.entries(vars).map(([k, v]) => [`--${k}`, v]));
};

// ---------- Fuentes del modelo (se piden a Google Fonts solo si hacen falta) ----------
export const cargarFuentes = (idTema) => {
  const t = temaDe(idTema);
  if (!t.fuentes) return;
  const id = `fuente-${idTema}`;
  if (document.getElementById(id)) return;
  const enlace = document.createElement('link');
  enlace.id = id;
  enlace.rel = 'stylesheet';
  enlace.href = `https://fonts.googleapis.com/css2?${t.fuentes}&display=swap`;
  document.head.appendChild(enlace);
};

// Pinta el modelo en toda la página
export const aplicarTema = (tienda) => {
  const raiz = document.documentElement;
  for (const [k, v] of Object.entries(variablesDeTema(tienda))) raiz.style.setProperty(k, v);
  raiz.dataset.tema = Object.hasOwn(TEMAS, tienda.tema) ? tienda.tema : 'clasico';
  cargarFuentes(tienda.tema);
};
