const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const Crushes = db.collection('crushes');
        const Messages = db.collection('messages');
        
        console.log('STRICT Migration: Checking all interactions...');
        const allCrushes = await Crushes.find({ message: { $exists: true, $ne: '' }, chatRoom: { $exists: true, $ne: '' } }).toArray();

        for (const crush of allCrushes) {
            // Find the VERY FIRST message in this room
            const firstMsg = await Messages.find({ room: crush.chatRoom }).sort({ createdAt: 1 }).limit(1).toArray();
            
            // If the first message in the DB is NOT the crush message, insert the crush message at the start
            const isMatch = firstMsg.length > 0 && (firstMsg[0].content === crush.message);
            
            if (!isMatch) {
                console.log(`Prepending missing initial message for room: ${crush.chatRoom}`);
                const timestamp = crush.createdAt ? new Date(crush.createdAt.getTime() - 1000) : new Date(Date.now() - 10000);
                
                await Messages.insertOne({
                    sender: crush.sender,
                    content: crush.message,
                    room: crush.chatRoom,
                    isGroup: false,
                    createdAt: timestamp,
                    updatedAt: timestamp
                });
            }
        }

        console.log('Strict Migration Complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
