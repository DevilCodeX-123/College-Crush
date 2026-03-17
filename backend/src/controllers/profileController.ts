import { Request, Response } from 'express';
import User from '../models/User.js';

interface CustomRequest extends Request {
    user?: any;
}

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req: CustomRequest, res: Response) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.bio = req.body.bio || user.bio;
        user.gender = req.body.gender || user.gender;
        user.profilePhoto = req.body.profilePhoto || user.profilePhoto;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            gender: updatedUser.gender,
            bio: updatedUser.bio,
            profilePhoto: updatedUser.profilePhoto,
            visitCount: updatedUser.visitCount,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get user profile by ID (and track visit)
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = async (req: CustomRequest, res: Response) => {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
        // Increment visit count if it's someone else visiting
        if (req.user && req.user._id.toString() !== req.params.id) {
            user.visitCount += 1;
            await user.save();
        }
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};
