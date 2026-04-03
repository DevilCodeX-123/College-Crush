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
        
        console.log('Migrating initial crush messages...');
        const allCrushes = await Crushes.find({ chatRoom: { $exists: true, $ne: '' } }).toArray();

        for (const crush of allCrushes) {
            // Check if this room already has a message from this sender
            // (A bit loose, but good for backfilling the initial one)
            const exists = await Messages.findOne({ room: crush.chatRoom });
            
            if (!exists && crush.message) {
                console.log(`Migrating message for room: ${crush.chatRoom}`);
                await Messages.insertOne({
                    sender: crush.sender,
                    content: crush.message,
                    room: crush.chatRoom,
                    isGroup: false,
                    createdAt: crush.createdAt || new Date(),
                    updatedAt: crush.updatedAt || new Date()
                });
            }
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
