import { Router } from 'express';
import { webhook } from '../controllers/pagosController.js';

const router = Router();
router.post('/webhook', webhook); // público: lo llama Mercado Pago (se valida su firma y el pago se consulta a Mercado Pago)
export default router;
