import { Router } from 'express';
import * as c from '../controllers/pedidosController.js';
import * as pagos from '../controllers/pagosController.js';
import { limitar } from '../utils/limitador.js';
import { verificarToken, soloAdmin } from '../middleware/auth.js';

const limitePagos = limitar({ ventanaMs: 60_000, max: 30, mensaje: 'Demasiados intentos de pago. Esperá un minuto.' });

const router = Router();
router.use(verificarToken); // todo lo de pedidos requiere sesión iniciada

router.post('/', c.crear);
router.get('/mios', c.misPedidos);                 // antes de "/:id"
router.get('/resumen', soloAdmin, c.resumen);     // antes de "/:id"
router.get('/', soloAdmin, c.listarTodos);
router.get('/:id', c.obtener);
router.post('/:id/pagar-mp', limitePagos, pagos.pagarConMercadoPago);
router.post('/:id/verificar-pago', limitePagos, pagos.verificarPago);
router.put('/:id/estado', soloAdmin, c.cambiarEstado);

export default router;
