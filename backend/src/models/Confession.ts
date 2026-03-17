import mongoose from 'mongoose';

const confessionSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reactions: {
        love: { type: Number, default: 0 },
        funny: { type: Number, default: 0 },
        shocked: { type: Number, default: 0 },
        fire: { type: Number, default: 0 }
    },
    reactedUsers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String }
    }],
    isAnonymous: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Indexing for feed performance
confessionSchema.index({ createdAt: -1 });

const Confession = mongoose.model('Confession', confessionSchema);
export default Confession;
