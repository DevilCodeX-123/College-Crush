import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB');
        
        const userId = '69bbb2215617917cce433393';
        const user = await User.findById(userId);
        
        if (user) {
            user.role = 'admin';
            await user.save();
            console.log(`User ${user.name} is now an ADMIN`);
        } else {
            console.log('User not found');
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

makeAdmin();
