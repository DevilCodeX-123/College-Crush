import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config({ path: '../.env' });

const setupUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const email = 'abc@gmail.com';
        const password = 'password123';
        
        let user = await User.findOne({ email });
        
        if (user) {
            user.password = password;
            user.role = 'admin'; // FORCE ADMIN
            await user.save();
            console.log(`✅ User ${email} password reset to ${password} and granted ADMIN role`);
        } else {
            user = await User.create({
                name: 'Test Admin Boss',
                email: email,
                password: password,
                gender: 'Male',
                theme: 'blue',
                role: 'admin' // FORCE ADMIN
            });
            console.log(`✅ User ${email} created with password ${password} and ADMIN role`);
        }
        process.exit(0);
    } catch (error: any) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

setupUser();
