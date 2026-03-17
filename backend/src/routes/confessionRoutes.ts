import express from 'express';
import { createConfession, getConfessions, reactToConfession, deleteConfession, reportConfession } from '../controllers/confessionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getConfessions)
    .post(protect, createConfession as any);

router.route('/:id')
    .delete(protect, deleteConfession as any);

router.post('/:id/react', protect, reactToConfession as any);
router.post('/:id/report', protect, reportConfession as any);

export default router;
