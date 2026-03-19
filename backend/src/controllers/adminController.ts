import { Request, Response } from 'express';
import User from '../models/User.js';
import Report from '../models/Report.js';
import Ad from '../models/Ad.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import Confession from '../models/Confession.js';
import Group from '../models/Group.js';
import GroupRequest from '../models/GroupRequest.js';

interface CustomRequest extends Request {
    user?: any;
}

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsersCount = await User.countDocuments({ updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
        const totalReports = await Report.countDocuments({ status: 'pending' });
        const totalConfessions = await Confession.countDocuments();

        // Count chats in last 24h
        const chatsToday = await Message.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });

        res.json({
            totalUsers,
            activeUsers: activeUsersCount,
            totalReports,
            totalConfessions,
            chatsToday
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics' });
    }
};

// @desc    Get all users with advanced filtering
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// @desc    Action on user (warn, mute, ban)
// @route   PUT /api/admin/users/:id/action
// @access  Private/Admin
export const handleUserAction = async (req: CustomRequest, res: Response) => {
    const { action, durationDays } = req.body; // warn, mute, banTemp, banPerm, shadowBan

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        switch (action) {
            case 'warn':
                user.warnings += 1;
                break;
            case 'mute':
                user.isMuted = true;
                user.muteExpiry = new Date(Date.now() + (durationDays || 1) * 24 * 60 * 60 * 1000);
                break;
            case 'unmute':
                user.isMuted = false;
                user.muteExpiry = undefined;
                break;
            case 'banTemp':
                user.banStatus = 'temporary';
                user.banExpiry = new Date(Date.now() + (durationDays || 7) * 24 * 60 * 60 * 1000);
                break;
            case 'banPerm':
                user.banStatus = 'permanent';
                break;
            case 'shadowBan':
                user.banStatus = 'shadow';
                break;
            case 'unban':
                user.banStatus = 'none';
                user.banExpiry = undefined;
                break;
            default:
                res.status(400).json({ message: 'Invalid action' });
                return;
        }

        await user.save();
        res.json({ message: `Action ${action} applied successfully`, user });
    } catch (error) {
        res.status(500).json({ message: 'Error applying action' });
    }
};

// @desc    Get reports with deep chat context
// @route   GET /api/admin/reports
// @access  Private/Admin
export const getAdvancedReports = async (req: Request, res: Response) => {
    try {
        const reports = await Report.find({})
            .populate('reporter', 'name email profilePhoto')
            .populate('target', 'name email profilePhoto')
            .populate('chatLogs.sender', 'name')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reports' });
    }
};

// @desc    Get all ads
// @route   GET /api/admin/ads
// @access  Private/Admin
export const getAds = async (req: Request, res: Response) => {
    try {
        const ads = await Ad.find({}).sort({ createdAt: -1 });
        res.json(ads);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching ads' });
    }
};

// @desc    Create an ad
// @route   POST /api/admin/ads
// @access  Private/Admin
export const createAd = async (req: Request, res: Response) => {
    try {
        const ad = await Ad.create(req.body);
        res.status(201).json(ad);
    } catch (error) {
        res.status(500).json({ message: 'Error creating ad' });
    }
};

// @desc    Get all rooms (groups)
// @route   GET /api/admin/rooms
// @access  Private/Admin
export const getRooms = async (req: Request, res: Response) => {
    try {
        const rooms = await Group.find({}).populate('admin', 'name email profilePhoto').sort({ createdAt: -1 });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms' });
    }
};

// @desc    Create a new room (group)
// @route   POST /api/admin/rooms
// @access  Private/Admin
export const createRoom = async (req: CustomRequest, res: Response) => {
    const { name, description, type, adminEmail } = req.body;
    try {
        let adminId = req.user._id;

        if (type === 'private' && adminEmail) {
            const adminUser = await User.findOne({ email: adminEmail });
            if (adminUser) {
                adminId = adminUser._id;
            } else {
                res.status(404).json({ message: 'Admin user with this email not found' });
                return;
            }
        }

        const room = await Group.create({
            name,
            description,
            type,
            admin: adminId,
            members: [adminId] // Add admin to members by default
        });

        const populatedRoom = await Group.findById(room._id).populate('admin', 'name email profilePhoto');
        res.status(201).json(populatedRoom);
    } catch (error) {
        res.status(500).json({ message: 'Error creating room' });
    }
};

// @desc    Delete a room (group)
// @route   DELETE /api/admin/rooms/:id
// @access  Private/Admin
export const deleteRoom = async (req: Request, res: Response) => {
    try {
        const room = await Group.findById(req.params.id);
        if (!room) {
            res.status(404).json({ message: 'Room not found' });
            return;
        }
        await room.deleteOne();
        res.json({ message: 'Room removed' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting room' });
    }
};

// @desc    Get all room creation requests
// @route   GET /api/admin/room-requests
// @access  Private/Admin
export const getRoomRequests = async (req: Request, res: Response) => {
    try {
        const requests = await GroupRequest.find({ type: 'create', status: 'pending' })
            .populate('requester', 'name email year branch profilePhoto')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching room requests' });
    }
};

// @desc    Approve a room creation request
// @route   PUT /api/admin/room-requests/:id/approve
// @access  Private/Admin
export const approveRoomRequest = async (req: Request, res: Response) => {
    try {
        const request = await GroupRequest.findById(req.params.id);
        if (!request || request.type !== 'create' || request.status !== 'pending') {
            res.status(404).json({ message: 'Valid pending room request not found' });
            return;
        }

        // Create the group
        const newGroup = await Group.create({
            name: request.groupData?.name,
            description: request.groupData?.description,
            type: request.groupData?.type,
            admin: request.requester,
            members: [request.requester]
        });

        // Update request status
        request.status = 'approved';
        request.group = newGroup._id;
        await request.save();

        res.json({ message: 'Room request approved and room created', group: newGroup });
    } catch (error) {
        res.status(500).json({ message: 'Error approving room request' });
    }
};

// @desc    Reject a room creation request
// @route   PUT /api/admin/room-requests/:id/reject
// @access  Private/Admin
export const rejectRoomRequest = async (req: Request, res: Response) => {
    try {
        const request = await GroupRequest.findById(req.params.id);
        if (!request || request.status !== 'pending') {
            res.status(404).json({ message: 'Pending request not found' });
            return;
        }

        request.status = 'rejected';
        await request.save();

        res.json({ message: 'Room request rejected' });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting room request' });
    }
};
