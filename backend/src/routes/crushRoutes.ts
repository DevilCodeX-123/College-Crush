import express from 'express';
import { sendCrush, getMyCrushes, revealCrushIdentity } from '../controllers/crushController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getMyCrushes as any)
    .post(protect, sendCrush as any);

router.put('/:id/reveal', protect, revealCrushIdentity as any);

export default router;
