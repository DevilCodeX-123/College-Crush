const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const Crushes = db.collection('crushes');
        const Messages = db.collection('messages');
        
        console.log('STANDARDISING Room IDs...');
        const allCrushes = await Crushes.find({}).toArray();

        for (const crush of allCrushes) {
            const id1 = crush.sender.toString();
            const id2 = crush.receiver.toString();
            const sortedRoom = [id1, id2].sort().join('_');
            
            if (crush.chatRoom !== sortedRoom) {
                console.log(`Updating Crush ${crush._id}: ${crush.chatRoom} -> ${sortedRoom}`);
                await Crushes.updateOne({ _id: crush._id }, { $set: { chatRoom: sortedRoom } });
                
                // ALSO update any messages that were sent to the old room ID
                if (crush.chatRoom && crush.chatRoom !== sortedRoom) {
                    const result = await Messages.updateMany({ room: crush.chatRoom }, { $set: { room: sortedRoom } });
                    if (result.modifiedCount > 0) {
                        console.log(`  Migrated ${result.modifiedCount} messages from ${crush.chatRoom} to ${sortedRoom}`);
                    }
                }
            }
        }

        // Final check: find any messages in "reverse" rooms that didn't have a crush record
        const allMessages = await Messages.find({ room: /_/ }).toArray();
        for (const msg of allMessages) {
            const parts = msg.room.split('_');
            if (parts.length === 2) {
                const sorted = [...parts].sort().join('_');
                if (msg.room !== sorted) {
                    console.log(`Correcting stray message room: ${msg.room} -> ${sorted}`);
                    await Messages.updateOne({ _id: msg._id }, { $set: { room: sorted } });
                }
            }
        }

        console.log('Standardisation Complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
