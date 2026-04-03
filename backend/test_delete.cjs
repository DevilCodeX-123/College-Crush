const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const Crushes = db.collection('crushes');
        
        // Find one crush to test if schema logic breaks
        const crush = await Crushes.findOne({});
        console.log("Found crush:", crush._id);
        
        if (crush) {
            console.log("Success reading crush.");
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
