import mongoose from 'mongoose';

const qrSettingsSchema = new mongoose.Schema({
    bannerImage: { type: String, default: '' },
    fullQRImage: { type: String, default: '' },
    qrParts: [{ type: String }], // URLs for 4 parts
    videoUrl: { type: String, default: '' },
    videoAutoplayDelay: { type: Number, default: 0 },
    isAutoplayEnabled: { type: Boolean, default: true },
    cta: {
        url: { type: String, default: '' },
        text: { type: String, default: 'Register Now' },
        visible: { type: Boolean, default: true },
        openInNewTab: { type: Boolean, default: true }
    },
    settings: {
        isActive: { type: Boolean, default: true },

        confetti: { type: Boolean, default: true },
        sound: { type: Boolean, default: true },
        countdownEnabled: { type: Boolean, default: false },
        countdownEnd: { type: Date }
    }

}, {
    timestamps: true
});

const QRSettings = mongoose.model('QRSettings', qrSettingsSchema);
export default QRSettings;
