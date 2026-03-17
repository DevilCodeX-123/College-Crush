import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI as string, {
            serverSelectionTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000,
            family: 4 // Force IPv4
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`❌ Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
