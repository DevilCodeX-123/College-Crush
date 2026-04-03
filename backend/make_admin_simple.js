const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = mongoose.model('User', new mongoose.Schema({
    role: String,
    name: String,
    email: String
}));

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const userId = '69bbb2215617917cce433393';
        const user = await User.findById(userId);
        
        if (user) {
            user.role = 'admin';
            await user.save();
            console.log(`User ${user.name} is now an ADMIN`);
        } else {
            console.log('User not found');
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

makeAdmin();
