// models/User.js (Updated for Phase 5)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    // Fields from Step 1 of your proposal
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    campus: { type: String, required: true },
    causes_interests: { type: [String], default: [] },
    availability_basic: { type: [String], default: [] },
    motivation: { type: String, default: '' },
    
    // --- NEW FIELD FOR ONBOARDING ---
    onboardingStatus: {
        type: String,
        enum: ['account_created', 'orientation_complete', 'profile_complete'],
        default: 'account_created'
    },
    // ---
    
    // Other fields we've used previously
    googleId: { type: String },
    profilePicture: { type: String, default: '/uploads/default-avatar.png' },
    
    createdAt: { type: Date, default: Date.now }
});

// pre-save hook for password hashing (no changes here)
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) { next(err); }
});

module.exports = mongoose.model('User', UserSchema);