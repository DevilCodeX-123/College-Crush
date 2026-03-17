import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config({ path: '../.env' });

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const user = await User.findOne({ email: 'abc@gmail.com' });
        if (user) {
            console.log('✅ User abc@gmail.com EXISTS in the database.');
        } else {
            console.log('❌ User abc@gmail.com DOES NOT EXIST in the database.');
        }
        process.exit(0);
    } catch (error: any) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

checkUsers();
