import { Request, Response } from 'express';
import QRSettings from '../models/QRSettings.js';
import QRToken from '../models/QRToken.js';
import crypto from 'crypto';

interface CustomRequest extends Request {
    user?: any;
}

// @desc    Get QR Reveal settings
// @route   GET /api/qr/settings
// @access  Public
export const getQRSettings = async (req: Request, res: Response) => {
    try {
        let settings = await QRSettings.findOne();
        if (!settings) {
            // Create default settings if not exists
            settings = await QRSettings.create({ settings: { isActive: true } });
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching QR settings' });
    }
};

// @desc    Update QR Reveal settings
// @route   PUT /api/qr/settings
// @access  Private/Admin
export const updateQRSettings = async (req: Request, res: Response) => {
    try {
        let settings = await QRSettings.findOne();
        if (!settings) {
            settings = new QRSettings(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        await settings.save();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error updating QR settings' });
    }
};

// @desc    Generate 4 QR tokens
// @route   POST /api/qr/tokens
// @access  Private/Admin
export const generateQRTokens = async (req: Request, res: Response) => {
    try {
        // Clear existing tokens
        await QRToken.deleteMany({});

        const tokens = [];
        for (let i = 0; i < 4; i++) {
            const tokenValue = crypto.randomBytes(16).toString('hex');
            const newToken = await QRToken.create({
                token: tokenValue,
                partIndex: i
            });
            tokens.push(newToken);
        }

        res.status(201).json(tokens);
    } catch (error) {
        res.status(500).json({ message: 'Error generating QR tokens' });
    }
};

// @desc    Reveal a part using a token
// @route   POST /api/qr/reveal
// @access  Public
export const revealPart = async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
        res.status(400).json({ message: 'Token is required' });
        return;
    }

    try {
        const qrToken = await QRToken.findOne({ token });

        if (!qrToken) {
            res.status(404).json({ message: 'Invalid or expired token' });
            return;
        }

        // We can choose to mark it as used if we want single-use
        // For this feature, maybe multi-use is better so users can share or reload
        // qrToken.isUsed = true;
        // await qrToken.save();

        res.json({ partIndex: qrToken.partIndex });
    } catch (error) {
        res.status(500).json({ message: 'Error validating token' });
    }
};

// @desc    Get all current tokens (for admin preview)
// @route   GET /api/qr/tokens
// @access  Private/Admin
export const getQRTokens = async (req: Request, res: Response) => {
    try {
        const tokens = await QRToken.find().sort({ partIndex: 1 });
        res.json(tokens);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tokens' });
    }
};
