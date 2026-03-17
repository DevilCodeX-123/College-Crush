import { Request, Response } from 'express';
import Message from '../models/Message.js';
import Friendship from '../models/Friendship.js';

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:id
// @access  Private
export const getMessages = async (req: any, res: Response) => {
    try {
        const { id } = req.params; // Room ID or Friend ID
        const messages = await Message.find({ room: id })
            .sort({ createdAt: 1 })
            .populate('sender', 'name profilePhoto');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

// @desc    Send a message
// @route   POST /api/chat/messages
// @access  Private
export const sendMessage = async (req: any, res: Response) => {
    try {
        const { room, content, isGroup } = req.body;
        const message = await Message.create({
            sender: req.user._id,
            content,
            room,
            isGroup
        });
        
        const populatedMessage = await message.populate('sender', 'name profilePhoto');
        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message' });
    }
};
