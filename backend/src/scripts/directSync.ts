import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function run() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    try {
        console.log('🔗 Direct connecting to Atlas...');
        await client.connect();
        const db = client.db('clgcrush');
        
        console.log('✅ Connected! Materializing collections...');
        const collections = ['users', 'confessions', 'crushes', 'messages', 'reports'];
        for (const col of collections) {
            await db.collection(col).insertOne({ genesis: true, timestamp: new Date() });
            console.log(`📦 Created ${col}`);
        }
        console.log('✨ SUCCESS! Your database is now visible in Atlas.');
    } catch (e) {
        console.error('❌ Connection Failed:', e.message);
    } finally {
        await client.close();
        process.exit();
    }
}
run();
