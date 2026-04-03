const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: '../.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const Crushes = db.collection('crushes');
        const Messages = db.collection('messages');
        
        console.log('Ensuring all interactions have corresponding messages...');
        const allCrushes = await Crushes.find({ chatRoom: { $exists: true, $ne: '' } }).toArray();

        for (const crush of allCrushes) {
            // Check for ANY message in this room
            const existingMessages = await Messages.find({ room: crush.chatRoom }).sort({ createdAt: 1 }).toArray();
            
            // If the crush message is not the first message, prepend it
            const hasInitial = existingMessages.some(m => m.content === crush.message || m.content.includes(crush.message));
            
            if (!hasInitial && crush.message) {
                console.log(`Adding missing initial message for room: ${crush.chatRoom}`);
                await Messages.insertOne({
                    sender: crush.sender,
                    content: crush.message,
                    room: crush.chatRoom,
                    isGroup: false,
                    createdAt: new Date(crush.createdAt.getTime() - 1000), // Ensure it's the earliest
                    updatedAt: new Date(crush.createdAt.getTime() - 1000)
                });
            }
            
            // Also ensure revealedToSender is true if revealedToReceiver is true (Migration for my new logic)
            if (crush.revealedToReceiver && !crush.revealedToSender) {
                console.log(`Setting bi-directional reveal for crush: ${crush._id}`);
                await Crushes.updateOne({ _id: crush._id }, { $set: { revealedToSender: true } });
            }
        }

        console.log('Migration and Fix complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
