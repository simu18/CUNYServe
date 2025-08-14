// models/ScrapedEvent.js

const mongoose = require('mongoose');

const ScrapedEventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    college: { type: String },
    date: { type: String }, // Raw date string from the site
    time: { type: String }, // Raw time string from the site
    sourceUrl: { type: String, required: true, unique: true }, // Use the URL as a unique identifier
    status: {
        type: String,
        enum: ['unverified', 'approved', 'rejected'],
        default: 'unverified'
    },
    importedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ScrapedEvent', ScrapedEventSchema);