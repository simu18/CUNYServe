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
        cunyEvents: { new: Number, updated: Number, failed: Number },
        cunyAdmissions: { new: Number, updated: Number, failed: Number },
        nycService: { new: Number, updated: Number, failed: Number } // <-- New field
    },
    error: { type: String }
});

module.exports = mongoose.model('ScrapeHistory', ScrapeHistorySchema);
