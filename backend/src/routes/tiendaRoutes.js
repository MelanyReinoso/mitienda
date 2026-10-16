import { Router } from 'express';
import {
    obtenerPublica, obtenerAdmin, actualizarTienda, actualizarApariencia, actualizarPagos,
    crearEnvio, actualizarEnvio, eliminarEnvio,
} from '../controllers/tiendaController.js';
import { verificarToken, soloAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/', obtenerPublica);                                         // público
router.get('/admin', verificarToken, soloAdmin, obtenerAdmin);           // admin
router.put('/', verificarToken, soloAdmin, actualizarTienda);            // admin: datos de la tienda
router.put('/apariencia', verificarToken, soloAdmin, actualizarApariencia); // admin: modelo de diseño y personalización
router.put('/pagos', verificarToken, soloAdmin, actualizarPagos);        // admin: medios de pago
router.post('/envios', verificarToken, soloAdmin, crearEnvio);           // admin: métodos de envío
router.put('/envios/:id', verificarToken, soloAdmin, actualizarEnvio);
router.delete('/envios/:id', verificarToken, soloAdmin, eliminarEnvio);
export default router;
