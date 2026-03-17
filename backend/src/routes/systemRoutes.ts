import express from 'express';
import { syncDatabase } from '../controllers/systemController.js';

const router = express.Router();

router.post('/sync', syncDatabase);
router.get('/sync', syncDatabase);

export default router;
