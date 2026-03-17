import mongoose from 'mongoose';

const adSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    mediaUrl: { type: String }, // Image or Video URL
    clickUrl: { type: String, required: true },
    active: { type: Boolean, default: true },
    
    // Analytics
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    
    // Limits
    maxViewsPerUser: { type: Number, default: 1 },
    timeGapMinutes: { type: Number, default: 60 },
    reachLimit: { type: Number }, // Stop ad after this many views
    
    // Targeting
    targetPages: [{ type: String }], // 'home', 'confessions', 'dashboard', 'all'
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

const Ad = mongoose.model('Ad', adSchema);
export default Ad;
