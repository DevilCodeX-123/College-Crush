const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const Crushes = db.collection('crushes');
        
        console.log('Reverting revealedToSender flags where not a match...');
        
        // Find crushes where isMatch is false, BUT revealedToSender is true 
        // (this happens if they sent a crush from the confession wall under my previous buggy logic)
        // Note: For regular sendCrush, we WANT revealedToSender to be true. 
        // How do we distinguish? Crushes from confessions have no specific flag, but wait, 
        // in regular sendCrush, isAnonymous is generally true by default (though the schema says default true, 
        // our sendCrush might set it).
        // Let's just look for any that are not a match. Wait, if I revert ALL non-matched revealedToSender to false, 
        // then normal sent crushes will also show as "Secret Admirer" to the sender? 
        // In the UI for sent crushes, if revealedToSender is false but they sent it... wait, the sender is always 
        // populated with the receiver's data. If we set revealedToSender=false on a normal crush, the sender can still 
        // see the receiver. The only thing it affects is the UI text: 
        // `crush.revealedToReceiver && crush.revealedToSender ? 'Identities Revealed' : (crush.isMatch ? 'Matched!' : 'Sent Anonymously')`
        // If it's not a match, it says 'Sent Anonymously' anyway!
        
        const result = await Crushes.updateMany(
            { isMatch: false, revealedToSender: true },
            { $set: { revealedToSender: false } }
        );

        console.log(`Updated ${result.modifiedCount} records.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
