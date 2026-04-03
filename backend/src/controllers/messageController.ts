import { Request, Response } from 'express';
import Message from '../models/Message.js';
import Group from '../models/Group.js';
import { io } from '../server.js';

// @desc    Get messages for a conversation
// @route   GET /api/messages/:id
// @access  Private
export const getMessages = async (req: any, res: Response) => {
    try {
        const { id } = req.params; // Room ID (Group ID or Match ID)
        
        // Authorization check for private groups
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            const group = await Group.findById(id);
            if (group && group.type === 'private') {
                const userIdStr = req.user._id.toString();
                if (!group.members.some(m => m.toString() === userIdStr)) {
                    return res.status(403).json({ message: 'Unauthorized to view these messages' });
                }
            }
        }

        const messages = await Message.find({ room: id })
            .sort({ createdAt: 1 })
            .populate('sender', 'name profilePhoto');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

// @desc    Send a message (REST fallback/alternative)
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req: any, res: Response) => {
    try {
        const { room, content, isGroup } = req.body;
        const userId = req.user._id;

        // Authorization for private groups
        if (isGroup && room.match(/^[0-9a-fA-F]{24}$/)) {
            const group = await Group.findById(room);
            if (group && group.type === 'private') {
                if (!group.members.some(m => m.toString() === userId.toString())) {
                    return res.status(403).json({ message: 'Unauthorized to send to this group' });
                }
            }
        }

        const message = await Message.create({
            sender: userId,
            content,
            room,
            isGroup
        });
        
        const populatedMessage = await message.populate('sender', 'name profilePhoto');
        
        // Emit to socket for real-time consistency
        io.to(room).emit('receive_message', {
            _id: populatedMessage._id,
            room,
            content,
            isGroup,
            senderId: userId,
            sender: populatedMessage.sender,
            createdAt: populatedMessage.createdAt
        });

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message' });
    }
};
