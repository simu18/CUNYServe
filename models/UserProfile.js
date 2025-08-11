// models/UserProfile.js

const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['draft', 'complete'],
        default: 'draft'
    },
    // Basic Matching
    campus: { type: String, default: '' },
    boroughs_preferred: { type: [String], default: [] },
    opportunity_types: { type: [String], default: [] },
    // Causes & Skills
    causes: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    // Profile & Program
    major_program: { type: String, default: '' },
    graduation_year: { type: Number, default: null },
    bio: { type: String, default: '' }, // This can be a more detailed bio
    completed_at: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('UserProfile', UserProfileSchema);