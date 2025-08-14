// models/Event.js (Merged & Enhanced)

const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    // --- Core Details ---
    title: { 
        type: String, 
        required: true, 
        trim: true 
    },
    description: { 
        type: String, 
        trim: true,
        required: function() {
            // Keep old logic: description optional for private events,
            // required for public events
            return this.isPublic;
        }
    },
    start: { 
        type: Date, 
        required: true 
    },
    end: { 
        type: Date, 
        required: true 
    },
    location: { 
        type: String, 
        trim: true 
    },

    // --- New Fields for Public Events ---
    partnerName: { type: String }, // e.g., "Rescuing Leftover Cuisine"
    address: { type: String },
    mapURL: { type: String },
    sourceUrl: { type: String },

    // Indicates if this is a user's private calendar entry or a public event
    isPublic: { type: Boolean, default: false },

    // If it's a private user event, this is the user it belongs to
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },

    // If it was created from a scraped event, this links back to the source
    scrapedEventId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ScrapedEvent' 
    },

    // For legacy compatibility — still have a createdAt timestamp
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true }); // Adds createdAt & updatedAt automatically

module.exports = mongoose.model('Event', EventSchema);
