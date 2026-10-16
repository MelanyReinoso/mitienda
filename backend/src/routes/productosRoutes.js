import { Router } from 'express';
import * as c from '../controllers/productosController.js';
import { verificarToken, soloAdmin } from '../middleware/auth.js';

const router = Router();
const admin = [verificarToken, soloAdmin];

// Públicas
router.get('/', c.listar);

// Admin (esta ruta va ANTES de "/:id" para que "admin" no se confunda con un id)
router.get('/admin/todos', ...admin, c.listarAdmin);
router.get('/admin/:id', ...admin, c.obtenerAdmin);

router.get('/:id', c.obtener);
router.post('/', ...admin, c.crear);
router.put('/:id', ...admin, c.actualizar);
router.delete('/:id', ...admin, c.eliminar);
router.post('/:id/variantes', ...admin, c.crearVariante);

export default router;
