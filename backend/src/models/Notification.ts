import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['system', 'announcement', 'warning'], default: 'system' },
    expiresAt: { type: Date },
    active: { type: Boolean, default: true },
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Empty implies system-wide
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
