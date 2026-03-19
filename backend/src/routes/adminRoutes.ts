import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getAnalytics,
    getUsers,
    handleUserAction,
    getAdvancedReports,
    getAds,
    createAd,
    getRooms,
    createRoom,
    deleteRoom,
    getRoomRequests,
    approveRoomRequest,
    rejectRoomRequest
} from '../controllers/adminController.js';

const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(protect, admin);

router.route('/analytics').get(getAnalytics);
router.route('/users').get(getUsers);
router.route('/users/:id/action').put(handleUserAction);
router.route('/reports').get(getAdvancedReports);
router.route('/ads').get(getAds).post(createAd);
router.route('/rooms')
    .get(getRooms)
    .post(createRoom);
router.route('/rooms/:id')
    .delete(deleteRoom);
router.route('/room-requests').get(getRoomRequests);
router.route('/room-requests/:id/approve').put(approveRoomRequest);
router.route('/room-requests/:id/reject').put(rejectRoomRequest);

export default router;
