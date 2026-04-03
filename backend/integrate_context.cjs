const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const Crushes = db.collection('crushes');
        const Messages = db.collection('messages');
        const Confessions = db.collection('confessions');
        
        console.log('Integrating CONFESSION context into chat history...');
        const allCrushes = await Crushes.find({ chatRoom: { $exists: true, $ne: '' } }).toArray();

        for (const crush of allCrushes) {
            // Find if this crush came from a confession
            // (We'll search for a confession by the receiver where the time roughly matches or author is correct)
            const confession = await Confessions.findOne({ author: crush.receiver });
            
            if (confession) {
                // Check if context already exists in the room
                const exists = await Messages.findOne({ room: crush.chatRoom, content: { $regex: /ORIGINAL CONFESSION/ } });
                
                if (!exists) {
                    console.log(`Adding context for room: ${crush.chatRoom}`);
                    const timestamp = new Date(crush.createdAt.getTime() - 5000); // 5s before the first message
                    
                    await Messages.insertOne({
                        sender: crush.receiver, // The author of the confession is the "sender" of the context
                        content: `[ORIGINAL CONFESSION]: ${confession.content}`,
                        room: crush.chatRoom,
                        isGroup: false,
                        createdAt: timestamp,
                        updatedAt: timestamp
                    });
                }
            }
        }

        console.log('Context Integration Complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
