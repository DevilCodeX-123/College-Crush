import { Request, Response } from 'express';
import Crush from '../models/Crush.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { io } from '../server.js';

interface CustomRequest extends Request {
    user?: any;
}

// @desc    Send a crush request (Anonymous message)
// @route   POST /api/crushes
// @access  Private
export const sendCrush = async (req: CustomRequest, res: Response) => {
    try {
        const { receiverId, message } = req.body;
        const senderId = req.user._id;

        if (!receiverId) {
            return res.status(400).json({ message: 'Receiver ID is required' });
        }

        if (senderId.toString() === receiverId) {
            return res.status(400).json({ message: 'You cannot send a crush to yourself' });
        }

        // Find existing interaction in ANY direction
        let crush = await Crush.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });

        if (crush) {
            const isOriginalSender = crush.sender.toString() === senderId.toString();
            
            if (!isOriginalSender && !crush.isMatch) {
                // MATCH SCENARIO
                crush.isMatch = true;
                crush.revealedToReceiver = true;
                crush.revealedToSender = true;
                crush.message = message;
                crush.chatRoom = crush.chatRoom || [senderId, receiverId].sort().join('_');
            } else {
                // UPDATE/REPLY SCENARIO
                crush.message = message;
            }

            // ALWAYS create a message record if we have a room
            if (crush.chatRoom) {
                const newMessage = await Message.create({
                    sender: senderId,
                    content: crush.isMatch ? `[FOLLOW-UP]: ${message}` : message,
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
            return res.status(200).json({ crush, isMatch: crush.isMatch, message: "Reply sent!" });
        }

        // NEW CRUSH (User Rule applied: Sender reveals to receiver, Receiver is initially hidden)
        const roomID = [senderId, receiverId].sort().join('_');
        const newCrush = await Crush.create({
            sender: senderId,
            receiver: receiverId,
            message,
            revealedToReceiver: true,
            revealedToSender: false,
            chatRoom: roomID
        });

        // Initial message record
        await Message.create({
            sender: senderId,
            content: message,
            room: roomID,
            isGroup: false
        });

        // Increment receiver's crushCount
        await User.findByIdAndUpdate(receiverId, { $inc: { crushCount: 1 } });

        res.status(201).json({ crush: newCrush, isMatch: false });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Error sending crush' });
    }
};

// @desc    Get all crushes received/sent by user
// @route   GET /api/crushes
// @access  Private
export const getMyCrushes = async (req: CustomRequest, res: Response) => {
    const userId = req.user._id.toString();
    const sent = await Crush.find({ sender: req.user._id }).populate('receiver', 'name profilePhoto gender');
    const received = await Crush.find({ receiver: req.user._id }).populate('sender', 'name profilePhoto gender');
    
    // Mask identities unless MUTUAL reveal OR specific reveal conditions met
    const filterCrush = (c: any, role: 'sender' | 'receiver') => {
        const obj = c.toObject();
        const sender = obj.sender;
        const receiver = obj.receiver;

        // Logic: 
        // If I am the Receiver: Show Sender if revealedToReceiver is true
        // If I am the Sender: Show Receiver if revealedToSender is true

        const isVisible = role === 'receiver' ? obj.revealedToReceiver : obj.revealedToSender;

        if (!isVisible) {
            return {
                ...obj,
                [role === 'sender' ? 'receiver' : 'sender']: { 
                    name: 'Anonymous Soul', 
                    profilePhoto: '', 
                    gender: (role === 'sender' ? receiver.gender : sender.gender)
                }
            };
        }
        return obj;
    };

    const filteredSent = sent.map(c => {
        const obj = filterCrush(c, 'sender');
        if (!obj.chatRoom) {
            obj.chatRoom = [obj.sender._id || obj.sender, obj.receiver._id || obj.receiver].sort().join('_');
        }
        return obj;
    });

    const filteredReceived = received.map(c => {
        const obj = filterCrush(c, 'receiver');
        if (!obj.chatRoom) {
            obj.chatRoom = [obj.sender._id || obj.sender, obj.receiver._id || obj.receiver].sort().join('_');
        }
        return obj;
    });

    res.json({ sent: filteredSent, received: filteredReceived });
};

// @desc    Reveal identity
// @route   PUT /api/crushes/:id/reveal
// @access  Private
export const revealCrushIdentity = async (req: CustomRequest, res: Response) => {
    const crush = await Crush.findById(req.params.id);
    const userId = req.user._id.toString();

    if (!crush) {
        return res.status(404).json({ message: 'Crush not found' });
    }

    // Determine if the caller is the sender or receiver
    if (crush.sender.toString() === userId) {
        crush.revealedToReceiver = true;
    } else if (crush.receiver.toString() === userId) {
        crush.revealedToSender = true;
    } else {
        return res.status(403).json({ message: 'Not authorized' });
    }

    await crush.save();
    
    // Add Real-time socket emission to both users
    io.to(`user_${crush.sender}`).to(`user_${crush.receiver}`).emit('crush_updated');

    res.json(crush);
};

// @desc    Delete a crush interaction
// @route   DELETE /api/crushes/:id
// @access  Private
export const deleteCrush = async (req: CustomRequest, res: Response) => {
    try {
        const crushId = req.params.id;
        const userId = req.user._id;

        const crush = await Crush.findById(crushId);

        if (!crush) {
            return res.status(404).json({ message: 'Crush interaction not found' });
        }

        // Verify ownership (only sender or receiver can delete)
        if (crush.sender.toString() !== userId.toString() && crush.receiver.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this interaction' });
        }

        await Crush.findByIdAndDelete(crushId);
        
        if (crush.chatRoom) {
            await Message.deleteMany({ room: crush.chatRoom });
        }

        // Emit real-time deletion to both users
        io.to(`user_${crush.sender}`).to(`user_${crush.receiver}`).emit('crush_deleted', { id: crushId });

        res.json({ id: crushId, message: 'Crush interaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting crush:', error);
        res.status(500).json({ message: 'Error deleting crush interaction' });
    }
};
