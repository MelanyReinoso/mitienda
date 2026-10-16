-- 002: tabla para "Olvidé mi contraseña"
-- Guardamos solo el hash del token (igual que con las contraseñas); cada token sirve una vez y vence rápido.
CREATE TABLE IF NOT EXISTS reset_tokens (
  id_token    INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario  INT      NOT NULL,
  token_hash  CHAR(64) NOT NULL,
  expira_en   DATETIME NOT NULL,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reset_token (token_hash),
  CONSTRAINT fk_reset_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
    ON DELETE CASCADE
) ENGINE=InnoDB;
