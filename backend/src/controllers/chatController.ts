import { Request, Response } from 'express';
import User from '../models/User.js';
import Friendship from '../models/Friendship.js';
import Group from '../models/Group.js';
import GroupRequest from '../models/GroupRequest.js';

// @desc    Find an anonymous match based on interests
// @route   POST /api/chat/match
// @access  Private
export const findMatch = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { interests } = req.body;
        const interestList = interests && interests.length > 0 ? interests : user.interests;

        let match: any = null;

        // TIER 1: Common Interests + Opposite Gender
        match = await User.findOne({
            _id: { $ne: user._id },
            interests: { $in: interestList },
            gender: { $ne: user.gender },
            onlineStatus: 'Online'
        });

        // TIER 2: Common Interests + Any Gender
        if (!match) {
            match = await User.findOne({
                _id: { $ne: user._id },
                interests: { $in: interestList },
                onlineStatus: 'Online'
            });
        }

        // TIER 3: Random Opposite Gender
        if (!match) {
            match = await User.findOne({
                _id: { $ne: user._id },
                gender: { $ne: user.gender },
                onlineStatus: 'Online'
            });
        }

        // TIER 4: Random Any Gender (Fallback)
        if (!match) {
            match = await User.findOne({
                _id: { $ne: user._id }
            });
        }

        if (!match) {
            return res.status(404).json({ message: 'No users available for matching' });
        }
        
        // Use the interests provided in the request or from user profile
        const common = interestList.filter((i: string) => match.interests.includes(i));

        // Create a pending friendship
        const friendship = await Friendship.findOneAndUpdate(
            {
                $or: [
                    { userA: user._id, userB: match._id },
                    { userA: match._id, userB: user._id }
                ]
            },
            {
                userA: user._id,
                userB: match._id,
                status: 'matched',
                commonInterests: common
            },
            { upsert: true, new: true }
        );

        res.json({
            matchId: friendship._id,
            gender: match.gender,
            commonInterests: common
        });
    } catch (error) {
        res.status(500).json({ message: 'Error finding match' });
    }
};

// @desc    Send friend request within anonymous chat
// @route   POST /api/chat/friend-request/:id
// @access  Private
export const sendFriendRequest = async (req: any, res: Response) => {
    try {
        const friendship = await Friendship.findById(req.params.id);
        if (!friendship) return res.status(404).json({ message: 'Match not found' });

        if (friendship.status !== 'matched') {
            return res.status(400).json({ message: 'Can only send request to active matches' });
        }

        if (!friendship.revealedToA || !friendship.revealedToB) {
            return res.status(403).json({ message: 'Must mutually reveal identities before sending a friend request' });
        }

        friendship.status = 'requesting_friendship';
        friendship.friendRequestSentBy = req.user._id;
        await friendship.save();

        res.json(friendship);
    } catch (error) {
        res.status(500).json({ message: 'Error sending friend request' });
    }
};

// @desc    Accept friend request within anonymous chat
// @route   POST /api/chat/accept-friend/:id
// @access  Private
export const acceptFriendRequest = async (req: any, res: Response) => {
    try {
        const friendship = await Friendship.findById(req.params.id);
        if (!friendship) return res.status(404).json({ message: 'Match not found' });

        if (friendship.status !== 'requesting_friendship') {
            return res.status(400).json({ message: 'No pending friend request' });
        }

        if (friendship.friendRequestSentBy.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot accept your own request' });
        }

        friendship.status = 'friends';
        await friendship.save();

        const populated = await Friendship.findById(friendship._id)
            .populate('userA userB', 'name profilePhoto onlineStatus');

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Error accepting friend request' });
    }
};

// @desc    Reject friend request within anonymous chat
// @route   POST /api/chat/reject-friend/:id
// @access  Private
export const rejectFriendRequest = async (req: any, res: Response) => {
    try {
        const friendship = await Friendship.findById(req.params.id);
        if (!friendship) return res.status(404).json({ message: 'Match not found' });

        if (friendship.status !== 'requesting_friendship') {
            return res.status(400).json({ message: 'No pending friend request' });
        }

        // Reset to matched so they can try again or just chat
        friendship.status = 'matched';
        friendship.friendRequestSentBy = undefined;
        await friendship.save();

        res.json(friendship);
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting friend request' });
    }
};

// @desc    Get match details by ID
// @route   GET /api/chat/match/:id
// @access  Private
export const getMatchStatus = async (req: any, res: Response) => {
    try {
        const friendship = await Friendship.findById(req.params.id)
            .populate('userA userB', 'name profilePhoto onlineStatus');
            
        if (!friendship) return res.status(404).json({ message: 'Match not found' });
        
        // Basic security check: user must be part of the match
        if (friendship.userA._id.toString() !== req.user._id.toString() && 
            friendship.userB._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.json(friendship);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching match status' });
    }
};

// @desc    Reveal identity (Restricted to friends)
// @route   PUT /api/chat/reveal/:id
// @access  Private
export const revealIdentity = async (req: any, res: Response) => {
    try {
        const friendship = await Friendship.findById(req.params.id);
        if (!friendship) return res.status(404).json({ message: 'Match not found' });

        if (friendship.userA.toString() === req.user._id.toString()) {
            friendship.revealedToA = true;
        } else if (friendship.userB.toString() === req.user._id.toString()) {
            friendship.revealedToB = true;
        } else {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await friendship.save();

        const populatedFriendship = await Friendship.findById(friendship._id)
            .populate('userA', 'name gender')
            .populate('userB', 'name gender');

        res.json(populatedFriendship);
    } catch (error) {
        res.status(500).json({ message: 'Error revealing identity' });
    }
};

// @desc    Get all friends (revealed connections)
// @route   GET /api/chat/friends
// @access  Private
export const getFriends = async (req: any, res: Response) => {
    try {
        const friends = await Friendship.find({
            $or: [{ userA: req.user._id }, { userB: req.user._id }],
            status: { $in: ['matched', 'requesting_friendship', 'friends'] }
        }).populate('userA userB', 'name profilePhoto onlineStatus');
        
        const friendsData = friends.map(f => {
            const isUserA = f.userA._id.toString() === req.user._id.toString();
            const friend: any = isUserA ? f.userB : f.userA;
            const isRevealed = f.revealedToA && f.revealedToB;

            return {
                id: friend._id,
                friendshipId: f._id,
                name: isRevealed ? friend.name : 'Anonymous Soul',
                status: friend.onlineStatus || 'Offline',
                lastMessage: isRevealed ? 'Identity Revealed ✨' : 'Matched with you! 🕵️',
                photo: isRevealed ? friend.profilePhoto : null,
                matchType: isRevealed ? 'Elite Connection' : 'Shadow Connection',
                isRevealed: isRevealed
            };
        });
        
        res.json(friendsData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching friends' });
    }
};

// @desc    Remove/Disconnect friend or match
// @route   DELETE /api/chat/remove-friend/:id
// @access  Private
export const removeFriend = async (req: any, res: Response) => {
    try {
        const friendship = await Friendship.findById(req.params.id);
        if (!friendship) return res.status(404).json({ message: 'Friendship not found' });

        // Basic security check: user must be part of the friendship
        if (friendship.userA.toString() !== req.user._id.toString() && 
            friendship.userB.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await Friendship.findByIdAndDelete(req.params.id);
        res.json({ message: 'Friendship removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing friendship' });
    }
};

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private
export const getGroups = async (req: Request, res: Response) => {
    try {
        const groups = await Group.find({}).sort({ lastActivity: -1 });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching groups' });
    }
};

// @desc    Request to join a private group
// @route   POST /api/chat/groups/join/:id
// @access  Private
export const requestJoinGroup = async (req: any, res: Response) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const existingRequest = await GroupRequest.findOne({
            requester: req.user._id,
            group: group._id,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Request already pending' });
        }

        const request = await GroupRequest.create({
            requester: req.user._id,
            type: 'join',
            group: group._id
        });

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: 'Error requesting join' });
    }
};

// @desc    Request to create a new group
// @route   POST /api/chat/groups/create
// @access  Private
export const requestCreateGroup = async (req: any, res: Response) => {
    try {
        const { name, description, type } = req.body;
        
        const request = await GroupRequest.create({
            requester: req.user._id,
            type: 'create',
            groupData: { name, description, type }
        });

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: 'Error requesting group creation' });
    }
};

// @desc    Get pending group requests (Admin only)
// @route   GET /api/chat/admin/requests
// @access  Private (Admin Role would be better, but we'll use a simplified check)
export const getPendingRequests = async (req: any, res: Response) => {
    try {
        // Simplified admin check - you might want to add a real role check here
        const requests = await GroupRequest.find({ status: 'pending' })
            .populate('requester', 'name email')
            .populate('group', 'name');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching requests' });
    }
};

// @desc    Handle group request decision
// @route   PUT /api/chat/admin/requests/:id
// @access  Private (Admin)
export const handleRequestDecision = async (req: any, res: Response) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        const request = await GroupRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = status;
        await request.save();

        if (status === 'approved') {
            if (request.type === 'create') {
                await Group.create({
                    ...request.groupData,
                    admin: request.requester,
                    members: [request.requester]
                });
            } else if (request.type === 'join') {
                const group = await Group.findById(request.group);
                if (group && !group.members.includes(request.requester)) {
                    group.members.push(request.requester);
                    await group.save();
                }
            }
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: 'Error handling request decision' });
    }
};
