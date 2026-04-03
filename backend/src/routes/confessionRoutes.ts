import express from 'express';
import { createConfession, getConfessions, reactToConfession, deleteConfession, reportConfession, sendConfessionCrush } from '../controllers/confessionController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(optionalProtect, getConfessions)
    .post(protect, createConfession as any);

router.route('/:id')
    .delete(protect, deleteConfession as any);

router.post('/:id/react', protect, reactToConfession as any);
router.post('/:id/report', protect, reportConfession as any);
router.post('/:id/crush', protect, sendConfessionCrush as any);

export default router;
