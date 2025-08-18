// models/PreVerifiedUser.js

const mongoose = require('mongoose');

const PreVerifiedUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    emailVerificationToken: {
        type: String,
        required: true
    },
    emailVerificationExpires: {
        type: Date,
        required: true
    },
    // This will be true once they click the link, just before creating the final account
    isPreVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '1h' // Automatically delete this temporary document after 1 hour
    }
});

module.exports = mongoose.model('PreVerifiedUser', PreVerifiedUserSchema);