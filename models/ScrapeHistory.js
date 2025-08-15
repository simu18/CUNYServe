// models/ScrapeHistory.js

const mongoose = require('mongoose');

const ScrapeHistorySchema = new mongoose.Schema({
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    status: {
        type: String,
        enum: ['running', 'completed', 'failed'],
        required: true
    },
    triggeredBy: { type: String },
    stats: {
        totalFound: Number,
        newEvents: Number,
        updatedEvents: Number,
        errors: Number
    },
    error: { type: String }
});

module.exports = mongoose.model('ScrapeHistory', ScrapeHistorySchema);