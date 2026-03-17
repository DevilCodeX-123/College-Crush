import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    room: { type: String, required: true }, // Can be a group name or mutual match ID
    isGroup: { type: Boolean, default: false },
}, {
    timestamps: true
});

// Indexing for chat performance
messageSchema.index({ room: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
