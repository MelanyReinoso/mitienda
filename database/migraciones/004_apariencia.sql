-- 004: apariencia de la tienda (modelo de diseño + personalización)
--   tema            → modelo predeterminado (clasico, minimal, urbano, boutique, fresco)
--   esquinas/grilla → ajustes opcionales que pisan lo que define el modelo (NULL = lo del modelo)
--   aviso           → franja de anuncio arriba de todo (ej: "Envío gratis desde $50.000")
--   portada_*       → título y texto grande arriba del catálogo
ALTER TABLE tiendas
  ADD COLUMN tema            VARCHAR(20)  NOT NULL DEFAULT 'clasico',
  ADD COLUMN esquinas        VARCHAR(10)  NULL,
  ADD COLUMN grilla          VARCHAR(10)  NULL,
  ADD COLUMN aviso           VARCHAR(120) NULL,
  ADD COLUMN portada_titulo  VARCHAR(80)  NULL,
  ADD COLUMN portada_texto   VARCHAR(200) NULL;
