import express, { Router } from 'express';
import { subir } from '../controllers/uploadsController.js';
import { verificarToken, soloAdmin } from '../middleware/auth.js';

const router = Router();
// Primero se verifica que sea admin y recién después se lee el archivo (así nadie anónimo puede enviarnos datos pesados)
router.post(
    '/',
    verificarToken,
    soloAdmin,
    express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '3mb' }),
    subir
);
export default router;
