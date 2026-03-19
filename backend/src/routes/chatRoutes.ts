import express from 'express';
import {
    findMatch,
    getMatchStatus,
    revealIdentity,
    getGroups,
    getFriends,
    requestJoinGroup,
    requestCreateGroup,
    getPendingRequests,
    handleRequestDecision,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getGroupJoinRequests,
    handleJoinRequestDecision,
    leaveGroup,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';


const router = express.Router();

router.post('/match', protect, findMatch as any);
router.get('/match/:id', protect, getMatchStatus as any);
router.put('/reveal/:id', protect, revealIdentity as any);
router.get('/groups', protect, getGroups as any);
router.get('/friends', protect, getFriends as any);

// Group Requests
router.post('/groups/join/:id', protect, requestJoinGroup as any);
router.post('/groups/create', protect, requestCreateGroup as any);
router.post('/groups/:id/leave', protect, leaveGroup as any);
router.get('/groups/:id/requests', protect, getGroupJoinRequests as any);
router.put('/groups/requests/:requestId/decision', protect, handleJoinRequestDecision as any);

// Anonymous Chat Friend Requests
router.post('/friend-request/:id', protect, sendFriendRequest as any);
router.post('/accept-friend/:id', protect, acceptFriendRequest as any);
router.post('/reject-friend/:id', protect, rejectFriendRequest as any);
router.delete('/remove-friend/:id', protect, removeFriend as any);

// Admin Group Management
router.get('/admin/requests', protect, getPendingRequests as any);
router.put('/admin/requests/:id', protect, handleRequestDecision as any);

export default router;
