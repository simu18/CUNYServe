// models/ScrapeLog.js

const mongoose = require('mongoose');

const ScrapeLogSchema = new mongoose.Schema({
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    status: {
        type: String,
        enum: ['running', 'completed', 'failed'],
        required: true
    },
    stats: {
        cunyEvents: { type: Object },
        cunyAdmissions: { type: Object }
    },
    error: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ScrapeLog', ScrapeLogSchema);