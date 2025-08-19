
const express = require('express');
const router = express.Router();
const Event = require('../models/Event'); // We need the main Event model

// @route   GET /api/public/events
// @desc    Get all approved, public events for display on the events.html page
// @access  Public
router.get('/events', async (req, res) => {
    console.log('--- PUBLIC API HIT: GET /api/public/events ---');
    try {
        // Find all documents in the 'events' collection that have isPublic set to true.
        // This is where our approved, scraped events are stored.
        const publicEvents = await Event.find({ isPublic: true }).sort({ start: 1 });

        console.log(`[Public API] Found ${publicEvents.length} public events in the database.`);
        if (publicEvents.length > 0) {
            console.log(`[Public API] First event found: "${publicEvents[0].title}"`);
        }
        
        res.json(publicEvents);

    } catch (err) {
        console.error('--- ERROR in /api/public/events ---', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;