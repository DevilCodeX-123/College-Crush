import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getAnalytics,
    getUsers,
    handleUserAction,
    getAdvancedReports,
    getAds,
    createAd
} from '../controllers/adminController.js';

const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(protect, admin);

router.route('/analytics').get(getAnalytics);
router.route('/users').get(getUsers);
router.route('/users/:id/action').put(handleUserAction);
router.route('/reports').get(getAdvancedReports);
router.route('/ads').get(getAds).post(createAd);

export default router;
