import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Group from './src/models/Group.js';
import Friendship from './src/models/Friendship.js';
import { disconnectMatch, findMatch, requestJoinGroup } from './src/controllers/chatController.js';

dotenv.config({ path: '../.env' });

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        // 1. Test Public Group Join
        const publicGroup = await Group.findOne({ type: 'public' });
        const testUser = await User.findOne({ email: 'test@example.com' }) || await User.create({ name: 'Test User', email: 'test@example.com', password: 'password', gender: 'Male' });
        
        console.log('Testing public group join...');
        const reqJoin: any = { user: testUser, params: { id: publicGroup?._id } };
        const resJoin: any = { json: (data: any) => console.log('Join Public Response:', data.message) };
        await requestJoinGroup(reqJoin, resJoin);

        const updatedGroup = await Group.findById(publicGroup?._id);
        if (updatedGroup?.members.includes(testUser._id)) {
            console.log('✅ Public Group Join Success');
        } else {
            console.log('❌ Public Group Join Failed');
        }

        // 2. Test Shadow Match Recent Exclusion
        console.log('Testing Shadow Match exclusion...');
        const userA = await User.findOne({ email: 'userA@test.com' }) || await User.create({ name: 'User A', email: 'userA@test.com', password: 'password', gender: 'Male', interests: ['Coding'] });
        const userB = await User.findOne({ email: 'userB@test.com' }) || await User.create({ name: 'User B', email: 'userB@test.com', password: 'password', gender: 'Female', interests: ['Coding'] });
        const userC = await User.findOne({ email: 'userC@test.com' }) || await User.create({ name: 'User C', email: 'userC@test.com', password: 'password', gender: 'Female', interests: ['Coding'] });

        // Force userB into recentMatches of userA
        userA.recentMatches = [userB._id];
        await userA.save();

        const reqMatch: any = { user: userA, body: { interests: ['Coding'] } };
        const resMatch: any = { json: (data: any) => {
            console.log('Match result:', data.matchId ? 'Success' : 'Fail');
        }};
        
        // Mocking the Tier matching logic briefly or just running findMatch
        // findMatch should skip userB and match userC
        await findMatch(reqMatch, resMatch);
        
        const f = await Friendship.findOne({ $or: [{ userA: userA._id }, { userB: userA._id }] }).sort({ createdAt: -1 });
        if (f && (f.userA.toString() === userC._id.toString() || f.userB.toString() === userC._id.toString())) {
            console.log('✅ Recent Match Exclusion Success (Matched C over B)');
        } else {
            console.log('❌ Recent Match Exclusion Failed');
        }

        console.log('Verification script completed.');
        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
};

test();
