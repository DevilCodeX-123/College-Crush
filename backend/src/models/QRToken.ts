import mongoose from 'mongoose';

const qrTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    partIndex: { type: Number, required: true, min: 0, max: 3 },
    isUsed: { type: Boolean, default: false }
}, {
    timestamps: true
});

const QRToken = mongoose.model('QRToken', qrTokenSchema);
export default QRToken;
