import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['public', 'private'], default: 'public' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastActivity: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Group = mongoose.model('Group', groupSchema);
export default Group;
