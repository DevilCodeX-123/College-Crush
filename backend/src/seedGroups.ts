import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Group from './models/Group.js';

dotenv.config({ path: '../.env' });

const groups = [
    {
        name: 'Campus Vibes 🎓',
        description: 'The heartbeat of campus life. General chat for everyone!',
        type: 'public'
    },
    {
        name: 'Exam Stress Relief 📚',
        description: 'Study tips, support, and mutual complaining about finals.',
        type: 'public'
    },
    {
        name: 'Sports Hub 🏀',
        description: 'For the athletes, the cheerleaders, and the superfans.',
        type: 'public'
    },
    {
        name: 'Tech & Innovation 💻',
        description: 'Coding, gadgets, startups, and all things future-tech.',
        type: 'public'
    },
    {
        name: 'Foodies Corner 🍔',
        description: 'Discover the best street food and cafes around campus.',
        type: 'public'
    },
    {
        name: 'Elite Lounge 💎',
        description: 'A premium space for high-quality interactions and elite vibes.',
        type: 'public'
    }
];

const seedGroups = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB for seeding');

        for (const g of groups) {
            const exists = await Group.findOne({ name: g.name });
            if (!exists) {
                await Group.create(g);
                console.log(`Created group: ${g.name}`);
            } else {
                console.log(`Group already exists: ${g.name}`);
            }
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedGroups();
