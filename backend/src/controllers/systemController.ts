import { Request, Response } from 'express';
import User from '../models/User.js';
import Confession from '../models/Confession.js';
import Crush from '../models/Crush.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import Group from '../models/Group.js';

// @desc    Sync/Initialize Database Structure
// @route   POST /api/system/sync
// @access  Public (Can be restricted later)
export const syncDatabase = async (req: Request, res: Response) => {
    try {
        console.log('🔄 Elite Database Sync triggered...');
        
        // 1. Force collection creation with elite data patterns
        await User.updateOne({ email: 'elite@sync.com' }, { name: 'Elite Sync', password: 'sync', gender: 'Other' }, { upsert: true });
        await Crush.updateOne({ message: 'Elite Sync' }, { message: 'Initialized', isMatch: false }, { upsert: true });
        await Message.updateOne({ content: 'Elite Sync' }, { content: 'Initialized', room: 'sync' }, { upsert: true });
        await Report.updateOne({ reason: 'Elite Sync' }, { reason: 'Initialized', type: 'User' }, { upsert: true });
        
        // 2. Create the "Genesis" confession
        const count = await Confession.countDocuments();
        if (count === 0) {
            await Confession.create({
                content: "Welcome to ClgCrush! 🎓 Your database is now perfectly materialized in MongoDB Atlas. Start sharing your campus secrets! ✨❤️",
                reactions: { love: 1, funny: 0, shocked: 0, fire: 1 }
            });
        }

        // 3. Seed Default Groups
        const defaultGroups = [
            { name: 'Campus General', description: 'The main hub for all students. Share anything and everything here! 🏢' },
            { name: 'Confession Corner', description: 'Discuss the latest secrets and whispers from the confession wall. 🎭' },
            { name: 'Freshers Hub', description: 'A warm welcome to the newcomers! Connect and find your crew. 🎓' },
            { name: 'Tech & Innovations', description: 'Geek out about the latest tech, coding, and campus projects. 💻' },
            { name: 'Sports & Fitness', description: 'Find your workout partners, discuss games, and stay active. ⚽' },
            { name: 'Night Owls', description: 'For the late-night grinders and storytellers. The real talk happens here. 🌙' }
        ];

        for (const group of defaultGroups) {
            await Group.updateOne(
                { name: group.name },
                { $set: group },
                { upsert: true }
            );
        }

        const successHtml = `
            <div style="font-family: 'Inter', sans-serif; padding: 60px; text-align: center; background: #020617; color: white; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="background: linear-gradient(135deg, #ec4899, #3b82f6); padding: 2px; border-radius: 20px;">
                    <div style="background: #020617; padding: 40px; border-radius: 18px;">
                        <h1 style="font-size: 3.5rem; font-weight: 900; margin-bottom: 10px; background: linear-gradient(to right, #f472b6, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">📦 Structure Perfected!</h1>
                        <p style="font-size: 1.25rem; color: #94a3b8; font-weight: 300;">Your MongoDB Atlas Cluster is now 100% Elite.</p>
                        
                        <div style="margin-top: 30px; display: grid; grid-template-cols: 1fr; gap: 10px; text-align: left;">
                            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                                <span style="color: #10b981;">✓</span> Users, Confessions, Crushes, Messages, Reports created.
                            </div>
                        </div>

                        <p style="margin-top: 40px;">
                            <a href="http://localhost:5173" style="background: white; color: black; padding: 12px 30px; border-radius: 12px; font-weight: 900; text-decoration: none; display: inline-block;">ENTER THE APP</a>
                        </p>
                    </div>
                </div>
            </div>
        `;

        res.status(200).send(successHtml);
    } catch (error: any) {
        console.error('❌ Sync Error:', error.message);
        res.status(500).send(`<h1 style="color: red;">Initialization Blocked!</h1><p>${error.message}</p><p>TIP: Whitelist your IP in Atlas!</p>`);
    }
};
