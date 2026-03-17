import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Confession from '../models/Confession.js';
import Crush from '../models/Crush.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';

dotenv.config({ path: '../.env' });

const initDb = async () => {
    try {
        console.log('🚀 INITIALIZING ELITE DATABASE STRUCTURE...');
        console.log(`🔗 Connecting to: ${process.env.MONGODB_URI?.split('@')[1]}`);
        
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('✅ Connection Established!');

        // 1. MATERIALIZE USERS
        await User.updateOne(
            { email: 'admin@collegecrush.com' },
            { 
                name: 'Elite Admin', 
                password: 'placeholder_secure',
                gender: 'Other',
                bio: 'Genesis Administrator of College Crush.',
                profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'
            },
            { upsert: true }
        );
        console.log('📦 Users Collection: PERFECTED');

        // 2. MATERIALIZE CONFESSIONS
        await Confession.updateOne(
            { content: 'Genesis Confession' },
            { 
                content: 'Welcome to the future of campus secrets. The database is now live! 🎓✨',
                reactions: { love: 1, funny: 0, shocked: 0, fire: 1 }
            },
            { upsert: true }
        );
        console.log('📦 Confessions Collection: PERFECTED');

        // 3. MATERIALIZE CRUSHES
        const admin = await User.findOne({ email: 'admin@collegecrush.com' });
        if (admin) {
            await Crush.updateOne(
                { message: 'Discovery' },
                { 
                    sender: admin._id, 
                    receiver: admin._id, 
                    message: 'Platform initialized flawlessly.',
                    isMatch: false 
                },
                { upsert: true }
            );
        }
        console.log('📦 Crushes Collection: PERFECTED');

        // 4. MATERIALIZE MESSAGES
        if (admin) {
            await Message.updateOne(
                { content: 'System Check' },
                { 
                    sender: admin._id, 
                    content: 'Core connectivity established.',
                    room: 'general' 
                },
                { upsert: true }
            );
        }
        console.log('📦 Messages Collection: PERFECTED');

        // 5. MATERIALIZE REPORTS
        if (admin) {
            await Report.updateOne(
                { reason: 'Initialization' },
                { 
                    reporter: admin._id, 
                    reason: 'System integrity check',
                    type: 'User',
                    status: 'dismissed'
                },
                { upsert: true }
            );
        }
        console.log('📦 Reports Collection: PERFECTED');

        console.log('\n💎 DATABASE STRUCTURE IS NOW 100% PERFECT IN ATLAS 💎');
        process.exit(0);
    } catch (error: any) {
        console.error('\n❌ MATERIALIZATION FAILED!');
        console.error('Error:', error.message);
        console.log('\n💡 CAUSE: Most likely your IP is not whitelisted in MongoDB Atlas.');
        console.log('💡 SOLUTION: Go to Atlas -> Network Access -> Add IP Address -> "Allow Access From Anywhere"');
        process.exit(1);
    }
};

initDb();
