import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    target: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    confession: { type: mongoose.Schema.Types.ObjectId, ref: 'Confession' },
    reason: { type: String, required: true },
    type: { type: String, enum: ['User', 'Confession'], required: true },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
    content: { type: String }, // Snippet for admin review
    
    // Chat Context
    chatRoomId: { type: String },
    chatLogs: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String },
        timestamp: { type: Date }
    }],
    actionTaken: { type: String }
}, {
    timestamps: true
});

// Indexing for moderation performance
reportSchema.index({ status: 1 });
reportSchema.index({ type: 1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
