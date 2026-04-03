import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getQRSettings,
    updateQRSettings,
    generateQRTokens,
    revealPart,
    getQRTokens
} from '../controllers/qrController.js';

const router = express.Router();

// Public routes
router.get('/settings', getQRSettings);
router.post('/reveal', revealPart);

// Admin routes
router.use(protect, admin);
router.put('/settings', updateQRSettings);
router.post('/tokens', generateQRTokens);
router.get('/tokens', getQRTokens);

export default router;
