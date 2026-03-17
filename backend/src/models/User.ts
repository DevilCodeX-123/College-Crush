import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: '' },
    branch: { type: String, default: '' },
    year: { type: String, default: '' },
    interests: [{ type: String }],
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    profilePhoto: { type: String, default: '' },
    theme: { type: String, default: 'purple' }, // Default theme based on gender will be set on signup
    profileVisitors: [{
        visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
    }],
    visitCount: { type: Number, default: 0 },
    crushCount: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 },
    // Moderation Fields
    banStatus: { type: String, enum: ['none', 'temporary', 'permanent', 'shadow'], default: 'none' },
    banExpiry: { type: Date },
    warnings: { type: Number, default: 0 },
    isMuted: { type: Boolean, default: false },
    muteExpiry: { type: Date }
}, {
    timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Indexing for search and performance
userSchema.index({ name: 'text' });
userSchema.index({ visitCount: -1 });
userSchema.index({ crushCount: -1 });

const User = mongoose.model('User', userSchema);
export default User;
