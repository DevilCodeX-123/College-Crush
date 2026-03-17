import mongoose from 'mongoose';

const crushSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    isAnonymous: { type: Boolean, default: true },
    revealedToReceiver: { type: Boolean, default: false },
    revealedToSender: { type: Boolean, default: false },
    isMatch: { type: Boolean, default: false },
    chatRoom: { type: String, default: '' } // Unique room ID if matched
}, {
    timestamps: true
});

// Indexing for performance
crushSchema.index({ sender: 1, receiver: 1 }, { unique: true });
crushSchema.index({ receiver: 1, isMatch: 1 });

const Crush = mongoose.model('Crush', crushSchema);
export default Crush;
