import { Request, Response } from 'express';
import User from '../models/User.js';
import Friendship from '../models/Friendship.js';
import Group from '../models/Group.js';
import GroupRequest from '../models/GroupRequest.js';
import Message from '../models/Message.js';
import { io } from '../server.js';

// @desc    Find an anonymous match based on interests
// @route   POST /api/chat/match
// @access  Private
export const findMatch = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { interests } = req.body;
        const interestList = interests && interests.length > 0 ? interests : user.interests;

        // Exclude recent matches and ensure they are not matching the same person
        const excludedIds = [user._id, ...(user.recentMatches || [])];
        
        const genderPreference = { $ne: user.gender }; // Define genderPreference for opposite gender matching

        let match: any = null;

        // TIER 1: Exact Interest Match + Gender Pref
        match = await User.findOne({
            _id: { $nin: excludedIds },
            gender: genderPreference,
            interests: { $in: user.interests },
            onlineStatus: 'Online'
        });

        // TIER 2: Any Interest Match
        if (!match) {
            match = await User.findOne({
                _id: { $nin: excludedIds },
                interests: { $in: user.interests },
                onlineStatus: 'Online'
            });
        }

        // TIER 3: Gender Preference Match
        if (!match) {
            match = await User.findOne({
                _id: { $nin: excludedIds },
                gender: genderPreference,
                onlineStatus: 'Online'
            });
        }

        // TIER 4: Random Any Gender (Fallback - Still Online Only)
        if (!match) {
            match = await User.findOne({
                _id: { $nin: excludedIds },
                onlineStatus: 'Online'
            });
        }

        // TIER 5: Last Resort (Match anyone online except self)
        if (!match) {
            match = await User.findOne({
                _id: { $ne: user._id },
                onlineStatus: 'Online'
            });
        }

        if (!match) {
            return res.status(404).json({ message: 'No users available for matching' });
        }

        // Use the interests provided in the request or from user profile
        const common = interestList.filter((i: string) => match.interests.includes(i));

        // Create a pending friendship or update existing one
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
                commonInterests: common,
                revealedToA: false,
                revealedToB: false
            },
            { upsert: true, new: true }
        );

        // Update recent matches for both users
        const updateRecentMatches = async (uId: any, mId: any) => {
            const u = await User.findById(uId);
            if (u) {
                let currentRecent = (u.recentMatches as any[]) || [];
                // Remove if already exists to move to front, although nin should have caught it
                const mIdStr = mId.toString();
                currentRecent = currentRecent.filter(id => id.toString() !== mIdStr);
                currentRecent.unshift(mId as any);
                u.recentMatches = currentRecent.slice(0, 3);
                await u.save();
            }
        };

        await updateRecentMatches(user._id as any, match._id as any);
        await updateRecentMatches(match._id as any, user._id as any);

        // Notify the matched user if they are online
        io.to(`user_${match._id}`).emit('match_request', {
            matchId: friendship._id,
            gender: user.gender,
            commonInterests: common
        });

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

// @desc    Disconnect/End a match session
// @route   POST /api/chat/match/disconnect
// @access  Private
export const disconnectMatch = async (req: any, res: Response) => {
    try {
        const friendship = await Friendship.findOne({
            $or: [{ userA: req.user._id }, { userB: req.user._id }],
            status: { $in: ['matched', 'requesting_friendship'] }
        });

        if (friendship) {
            const matchId = friendship._id.toString();
            
            // Delete all messages associated with the match
            await Message.deleteMany({ room: matchId });
            
            await Friendship.findByIdAndDelete(friendship._id);
            
            // Notify the other user via socket
            io.to(matchId).emit('match_disconnected', {
                message: 'Your partner has disconnected.',
                matchId
            });
            
            res.json({ message: 'Match disconnected' });
        } else {
            res.status(404).json({ message: 'No active match found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error disconnecting match' });
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

        // Check if group is public. If so, join immediately.
        if (group.type === 'public') {
            const userIdStr = req.user._id.toString();
            if (!group.members.some(m => m.toString() === userIdStr)) {
                group.members.push(req.user._id);
                await group.save();
            }
            return res.json({ message: 'Joined public group successfully', group });
        }

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

// @desc    Get pending join requests for a specific group (Room Admin only)
// @route   GET /api/chat/groups/:id/requests
// @access  Private
export const getGroupJoinRequests = async (req: any, res: Response) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Check if user is room admin
        if (group.admin.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: 'Only room admin can view join requests' });
            return;
        }

        const requests = await GroupRequest.find({ group: group._id, type: 'join', status: 'pending' })
            .populate('requester', 'name email profilePhoto year branch');

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching join requests' });
    }
};

// @desc    Approve or Reject a join request (Room Admin only)
// @route   PUT /api/chat/groups/requests/:requestId/decision
// @access  Private
export const handleJoinRequestDecision = async (req: any, res: Response) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        const request = await GroupRequest.findById(req.params.requestId).populate('group');

        if (!request || request.type !== 'join') return res.status(404).json({ message: 'Join request not found' });

        const group = await Group.findById(request.group);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (group.admin.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: 'Only room admin can make this decision' });
            return;
        }

        request.status = status;
        await request.save();

        if (status === 'approved') {
            if (!group.members.includes(request.requester)) {
                group.members.push(request.requester);
                await group.save();
            }
        }

        res.json({ message: `Request ${status} successfully`, request });
    } catch (error) {
        res.status(500).json({ message: 'Error processing decision' });
    }
};

// @desc    Leave a group
// @route   POST /api/chat/groups/:id/leave
// @access  Private
export const leaveGroup = async (req: any, res: Response) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const userIdStr = req.user._id.toString();

        // Check if member
        if (!group.members.some(m => m.toString() === userIdStr)) {
            return res.status(400).json({ message: 'You are not a member of this group' });
        }

        // Remove member
        group.members = group.members.filter(m => m.toString() !== userIdStr);

        // If no members left, delete the group entirely
        if (group.members.length === 0) {
            await Group.findByIdAndDelete(group._id);
            // Optionally clean up requests and messages here later
            return res.json({ message: 'Group left and deleted because you were the last member' });
        }

        // If the user leaving is the admin, assign the next existing member as admin
        if (group.admin.toString() === userIdStr) {
            group.admin = group.members[0];
        }

        await group.save();
        res.json({ message: 'Successfully left the group', group });

    } catch (error) {
        res.status(500).json({ message: 'Error leaving group' });
    }
};
