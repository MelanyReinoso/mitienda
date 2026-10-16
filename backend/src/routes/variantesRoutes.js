import { Router } from 'express';
import { actualizarVariante, eliminarVariante } from '../controllers/productosController.js';
import { verificarToken, soloAdmin } from '../middleware/auth.js';

const router = Router();
router.put('/:id', verificarToken, soloAdmin, actualizarVariante);
router.delete('/:id', verificarToken, soloAdmin, eliminarVariante);
export default router;
