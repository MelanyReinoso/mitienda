-- 005: pagos con Mercado Pago
--   mp_payment_id → número del pago en Mercado Pago (único: un mismo pago no puede acreditar dos pedidos)
ALTER TABLE pedidos
  ADD COLUMN mp_payment_id VARCHAR(32) NULL,
  ADD UNIQUE KEY uq_pedido_mp_payment (mp_payment_id);
