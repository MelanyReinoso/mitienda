import { Router } from 'express';
import { registro, login, yo, olvide, restablecer } from '../controllers/authController.js';
import { verificarToken } from '../middleware/auth.js';
import { limitar } from '../utils/limitador.js';

// Máximo 5 pedidos de recuperación y 10 cambios de contraseña cada 15 minutos por IP
const limiteOlvide = limitar({ ventanaMs: 15 * 60 * 1000, max: 5, mensaje: 'Pediste demasiados links. Esperá unos minutos y probá de nuevo.' });
const limiteRestablecer = limitar({ ventanaMs: 15 * 60 * 1000, max: 10 });

const router = Router();
router.post('/registro', registro);
router.post('/login', login);
router.post('/olvide', limiteOlvide, olvide);
router.post('/restablecer', limiteRestablecer, restablecer);
router.get('/me', verificarToken, yo);
export default router;
