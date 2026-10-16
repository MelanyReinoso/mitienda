import { Router } from 'express';
import { listar, listarAdmin, crear, actualizar, eliminar } from '../controllers/categoriasController.js';
import { verificarToken, soloAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/', listar);                                              // público
router.get('/admin/todas', verificarToken, soloAdmin, listarAdmin);   // admin (antes de '/:id')
router.post('/', verificarToken, soloAdmin, crear);                   // admin
router.put('/:id', verificarToken, soloAdmin, actualizar);            // admin
router.delete('/:id', verificarToken, soloAdmin, eliminar);           // admin
export default router;
