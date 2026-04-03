import { Request, Response } from 'express';
import Confession from '../models/Confession.js';
import Report from '../models/Report.js';
import Crush from '../models/Crush.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { io } from '../server.js';

interface CustomRequest extends Request {
    user?: any;
}

// @desc    Create a new confession
// @route   POST /api/confessions
// @access  Public (Anonymous)
export const createConfession = async (req: CustomRequest, res: Response) => {
    const { content } = req.body;
    const authorId = req.user._id;

    if (!content) {
        res.status(400).json({ message: 'Confession content is required' });
        return;
    }

    const confession = await Confession.create({ 
        content,
        author: authorId
    });

    if (confession) {
        res.status(201).json(confession);
    } else {
        res.status(400).json({ message: 'Invalid confession data' });
    }
};

// @desc    Get all confessions
// @route   GET /api/confessions
// @access  Public
export const getConfessions = async (req: CustomRequest, res: Response) => {
    try {
        const confessions = await Confession.find({}).sort({ createdAt: -1 });
        res.json(confessions);
    } catch (error) {
        console.error('Error fetching confessions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// @desc    React to a confession
// @route   POST /api/confessions/:id/react
// @access  Private
export const reactToConfession = async (req: CustomRequest, res: Response) => {
    const { emoji } = req.body; // love, funny, shocked, fire
    const userId = req.user._id;

    try {
        const confession = await Confession.findById(req.params.id);

        if (!confession) {
            return res.status(404).json({ message: 'Confession not found' });
        }

        // Prevent self-reaction
        if (confession.author && confession.author.toString() === userId.toString()) {
            return res.status(400).json({ message: 'You cannot react to your own confession' });
        }

        const existingReactionIndex = confession.reactedUsers.findIndex(
            (r: any) => r.user.toString() === userId.toString()
        );

        if (existingReactionIndex > -1) {
            const currentEmoji = (confession as any).reactedUsers[existingReactionIndex].emoji;
            
            if (currentEmoji === emoji) {
                // Toggle off: remove reaction
                (confession.reactions as any)[emoji] = Math.max(0, (confession.reactions as any)[emoji] - 1);
                confession.reactedUsers.splice(existingReactionIndex, 1);
            } else {
                // Switch reaction: decrement old, increment new
                (confession.reactions as any)[currentEmoji] = Math.max(0, (confession.reactions as any)[currentEmoji] - 1);
                (confession.reactions as any)[emoji] += 1;
                (confession as any).reactedUsers[existingReactionIndex].emoji = emoji;
            }
        } else {
            // New reaction
            if (!['love', 'funny', 'shocked', 'fire'].includes(emoji)) {
                return res.status(400).json({ message: 'Invalid emoji reaction' });
            }
            (confession.reactions as any)[emoji] += 1;
            confession.reactedUsers.push({ user: userId, emoji });
        }

        const updatedConfession = await confession.save();
        res.json(updatedConfession);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Error reacting to confession' });
    }
};

// @desc    Delete a confession
// @route   DELETE /api/confessions/:id
// @access  Private
export const deleteConfession = async (req: CustomRequest, res: Response) => {
    try {
        const confession = await Confession.findById(req.params.id);

        if (!confession) {
            return res.status(404).json({ message: 'Confession not found' });
        }

        // Only admin can delete
        if (req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized. Only admins can delete confessions.' });
        }

        await Confession.findByIdAndDelete(req.params.id);
        res.json({ message: 'Confession removed' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting confession' });
    }
};

// @desc    Report a confession
// @route   POST /api/confessions/:id/report
// @access  Private
export const reportConfession = async (req: CustomRequest, res: Response) => {
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({ message: 'Report reason is required' });
    }

    try {
        const confession = await Confession.findById(req.params.id);

        if (!confession) {
            return res.status(404).json({ message: 'Confession not found' });
        }

        await Report.create({
            reporter: req.user._id,
            confession: confession._id,
            reason,
            type: 'Confession',
            content: confession.content.substring(0, 100) // Preview for admin
        });

        res.status(201).json({ message: 'Confession reported successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error reporting confession' });
    }
};

// @desc    Send a crush to confession author
// @route   POST /api/confessions/:id/crush
// @access  Private
export const sendConfessionCrush = async (req: CustomRequest, res: Response) => {
    const { message } = req.body;
    const senderId = req.user._id;

    if (!message) {
        return res.status(400).json({ message: 'Crush message is required' });
    }

    try {
        const confession = await Confession.findById(req.params.id);

        if (!confession) {
            return res.status(404).json({ message: 'Confession not found' });
        }

        const receiverId = confession.author;

        if (!receiverId) {
            return res.status(400).json({ message: 'Confession author not found' });
        }

        if (receiverId.toString() === senderId.toString()) {
            return res.status(400).json({ message: 'You cannot send a crush to yourself' });
        }

        const roomID = [senderId, receiverId].sort().join('_');

        // 1. Find if a interaction already exists in ANY direction
        let crush = await Crush.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });

        if (crush) {
            const isOriginalSender = crush.sender.toString() === senderId.toString();
            const wasMatch = crush.isMatch;

            if (!isOriginalSender && !crush.isMatch) {
                // MATCH SCENARIO: Receiver is now crushing back
                crush.isMatch = true;
                crush.revealedToReceiver = true; 
                crush.revealedToSender = true;   
                crush.message = message;
                crush.chatRoom = crush.chatRoom || roomID;
            } else {
                crush.message = message;
            }
            
            // ALWAYS create a message record if we have a room
            if (crush.chatRoom) {
                const newMessage = await Message.create({
                    sender: senderId,
                    content: wasMatch ? `[FOLLOW-UP]: ${message}` : `[CRUSH REPLY]: ${message}`,
                    room: crush.chatRoom,
                    isGroup: false
                });

                io.to(crush.chatRoom).emit('receive_message', {
                    _id: newMessage._id,
                    senderId: senderId,
                    content: newMessage.content,
                    room: crush.chatRoom,
                    createdAt: newMessage.createdAt
                });
            }

            await crush.save();
            await crush.populate('receiver', 'name profilePhoto');

            return res.json({ 
                message: (!isOriginalSender && !wasMatch) ? "It's a Match! ✨ Go check your Crush Wall." : "Interaction updated!",
                type: 'chat',
                crush 
            });
        }

        // 2. NEW CRUSH
        const newCrush = await Crush.create({
            sender: senderId,
            receiver: receiverId,
            message,
            revealedToReceiver: true, 
            revealedToSender: false,
            isAnonymous: false,
            chatRoom: roomID
        });

        // Create the initial message records
        // First: the context message
        await Message.create({
            sender: receiverId, // Confession author is the "owner" of this content
            content: `[ORIGINAL CONFESSION]: ${confession.content}`,
            room: roomID,
            isGroup: false
        });

        // Second: the sender's actual crush message
        const initialMsg = await Message.create({
            sender: senderId,
            content: message,
            room: roomID,
            isGroup: false
        });

        await newCrush.populate('receiver', 'name profilePhoto');

        res.status(201).json({ 
            message: 'Crush manifested! Your name has been revealed to them. ✨',
            crush: newCrush 
        });
    } catch (error: any) {
        console.error('CRUSH ERROR:', error.message);
        res.status(500).json({ message: 'Error sending crush' });
    }
};
