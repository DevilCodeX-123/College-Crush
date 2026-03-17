import mongoose from 'mongoose';

const groupRequestSchema = new mongoose.Schema({
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['join', 'create'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    
    // For join requests
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    
    // For creation requests
    groupData: {
        name: { type: String },
        description: { type: String },
        type: { type: String, enum: ['public', 'private'] }
    }
}, {
    timestamps: true
});

const GroupRequest = mongoose.model('GroupRequest', groupRequestSchema);
export default GroupRequest;
