const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: '../.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const collection = db.collection('crushes');
        
        console.log('Deduplicating crushes...');
        const duplicates = await collection.aggregate([
            { $group: { 
                _id: { sender: '$sender', receiver: '$receiver' }, 
                count: { $sum: 1 }, 
                ids: { $push: '$_id' } 
            } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();

        for (const dup of duplicates) {
            console.log(`Merging ${dup.count} for ${JSON.stringify(dup._id)}`);
            const latestId = dup.ids[dup.ids.length - 1];
            const idsToRemove = dup.ids.slice(0, -1);
            await collection.deleteMany({ _id: { $in: idsToRemove } });
        }

        console.log('Re-creating unique index...');
        try {
            await collection.dropIndex('sender_1_receiver_1').catch(() => {});
            await collection.createIndex({ sender: 1, receiver: 1 }, { unique: true });
            console.log('Unique index restored.');
        } catch (e) {
            console.log('Index operation failed:', e.message);
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
