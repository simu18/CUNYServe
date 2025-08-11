// models/UserOrientation.js

const mongoose = require('mongoose');

const UserOrientationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Each user has only one orientation document
    },
    status: {
        type: String,
        enum: ['draft', 'complete'],
        default: 'draft'
    },
    orientation_viewed: { type: Boolean, default: false },
    agree_code_of_conduct: { type: Boolean, default: false },
    agree_attendance_policy: { type: Boolean, default: false },
    age_confirm_18_plus: { type: Boolean, default: false },
    guardian_name: { type: String, default: null },
    guardian_phone: { type: String, default: null },
    media_consent: { type: String, enum: ['yes', 'no', null], default: null },
    comms_consent_email: { type: Boolean, default: false },
    comms_consent_sms: { type: Boolean, default: false },
    emergency_name: { type: String, default: '' },
    emergency_relationship: { type: String, default: '' },
    emergency_phone: { type: String, default: '' },
    completed_at: { type: Date, default: null }
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

module.exports = mongoose.model('UserOrientation', UserOrientationSchema);