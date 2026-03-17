import { Request, Response } from 'express';
import User from '../models/User.js';
import generateToken from '../config/generateToken.js';

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
    const { name, email, password, gender } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    // Set default theme based on gender
    let theme = 'purple';
    if (gender === 'Male') theme = 'blue';
    else if (gender === 'Female') theme = 'pink';

    const user = await User.create({
        name,
        email,
        password,
        gender,
        theme
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            gender: user.gender,
            theme: user.theme,
            role: user.role,
            profilePhoto: user.profilePhoto,
            token: generateToken(user._id.toString()),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const authUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await (user as any).matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            gender: user.gender,
            theme: user.theme,
            role: user.role,
            profilePhoto: user.profilePhoto,
            token: generateToken(user._id.toString()),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Get user profile (Private)
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: any, res: Response) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            gender: user.gender,
            bio: user.bio,
            profilePhoto: user.profilePhoto,
            theme: user.theme,
            role: user.role,
            visitCount: user.visitCount
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Public
export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const topUsers = await User.find({}).sort({ crushCount: -1 }).limit(10).select('name profilePhoto crushCount visitCount gender');
        res.json(topUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
};
