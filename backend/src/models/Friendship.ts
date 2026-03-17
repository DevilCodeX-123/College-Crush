import mongoose from 'mongoose';

const friendshipSchema = new mongoose.Schema({
    userA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
        type: String, 
        enum: ['pending', 'matched', 'requesting_friendship', 'friends'], 
        default: 'pending' 
    },
    commonInterests: [{ type: String }],
    friendRequestSentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    revealedToA: { type: Boolean, default: false },
    revealedToB: { type: Boolean, default: false },
    lastChatAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Ensure unique friendship between two users regardless of order
friendshipSchema.index({ userA: 1, userB: 1 }, { unique: true });

const Friendship = mongoose.model('Friendship', friendshipSchema);
export default Friendship;
