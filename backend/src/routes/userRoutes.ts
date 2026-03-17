import express from 'express';
import { registerUser, authUser, getLeaderboard } from '../controllers/userController.js';
import { updateUserProfile, getUserProfile } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', registerUser);
router.post('/login', authUser);
router.get('/leaderboard', getLeaderboard as any);
router.route('/profile').get(protect, getUserProfile as any).put(protect, updateUserProfile as any);
router.route('/:id').get(protect, getUserProfile as any);

export default router;
