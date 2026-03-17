import { Request, Response } from 'express';
import Crush from '../models/Crush.js';
import User from '../models/User.js';

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

        // Check if already sent
        const existing = await Crush.findOne({ sender: senderId, receiver: receiverId });
        if (existing) {
            return res.status(400).json({ message: 'You have already sent a crush to this person' });
        }

        const roomID = [senderId, receiverId].sort().join('_');

        const crush = await Crush.create({
            sender: senderId,
            receiver: receiverId,
            message,
            revealedToSender: true,
            chatRoom: roomID
        });

        // Increment receiver's crushCount
        await User.findByIdAndUpdate(receiverId, { $inc: { crushCount: 1 } });

        // Check for mutual match
        const mutual = await Crush.findOne({ sender: receiverId, receiver: senderId });
        if (mutual) {
            crush.isMatch = true;
            mutual.isMatch = true;
            mutual.chatRoom = roomID;

            await crush.save();
            await mutual.save();
            
            res.status(201).json({ crush, isMatch: true });
        } else {
            res.status(201).json({ crush, isMatch: false });
        }
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
        const otherParty = role === 'sender' ? obj.receiver : obj.sender;
        
        // Match logic: Both must reveal to see each other
        const isFullyRevealed = obj.revealedToReceiver && obj.revealedToSender;
        
        if (!isFullyRevealed) {
            return {
                ...obj,
                [role === 'sender' ? 'receiver' : 'sender']: { 
                    name: 'Anonymous Soul', 
                    profilePhoto: '', // Hide photo
                    gender: otherParty.gender 
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
    res.json(crush);
};
