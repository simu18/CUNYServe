// routes/admin.js (Updated to call runAllScrapers without Mongo URI)

const express = require('express');
const router = express.Router();

console.log('--- Loading routes/admin.js file ---');

const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { runAllScrapers } = require('../scrapers'); // <-- Updated import
const ScrapedEvent = require('../models/ScrapedEvent');
const Event = require('../models/Event');
const { parseCunyDateTime } = require('../utils/dateParser');

// -------------------------------------------------------------
// @route   GET /api/admin/test
// @desc    Simple test route
// @access  Public (for quick sanity check only)
// -------------------------------------------------------------
router.get('/test', (req, res) => {
    res.json({ message: 'Admin route is working!' });
});

// -------------------------------------------------------------
// @route   POST /api/admin/scrape-events
// @desc    Trigger all event scrapers
// @access  Private (Admin only)
// -------------------------------------------------------------
router.post('/scrape-events', [authMiddleware, adminAuth], async (req, res) => {
    console.log('Scrape request received from admin:', req.user?.email || 'Unknown User');

    // Respond right away so the request doesn't hang
    res.status(202).json({ msg: 'Scraping process for all sources has been started.' });

    // Just call the runner. It handles everything internally.
    runAllScrapers()
        .then(() => console.log('✅ All scrapers completed.'))
        .catch(err => {
            console.error("--- SCRAPER RUNNER BACKGROUND ERROR ---", err);
        });
});

// -------------------------------------------------------------
// @route   GET /api/admin/scraped-events
// @desc    Get all scraped events for review
// @access  Private (Admin only)
// -------------------------------------------------------------
router.get('/scraped-events', [authMiddleware, adminAuth], async (req, res) => {
    console.log('--- ADMIN: GET /scraped-events hit ---');
    try {
        const events = await ScrapedEvent.find().sort({ importedAt: -1 });
        console.log(`Found ${events.length} scraped events`);
        res.json(events);
    } catch (err) {
        console.error("Error fetching scraped events:", err);
        res.status(500).send('Server Error');
    }
});

// -------------------------------------------------------------
// @route   PUT /api/admin/scraped-events/:id
// @desc    Approve or reject a scraped event
// @access  Private (Admin only)
// -------------------------------------------------------------
router.put('/scraped-events/:id', [authMiddleware, adminAuth], async (req, res) => {
    console.log(`--- ADMIN: Received request to update event ${req.params.id} to status '${req.body.status}' ---`);
    
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            console.warn(`Invalid status value: ${status}`);
            return res.status(400).json({ msg: 'Invalid status.' });
        }

        const scrapedEvent = await ScrapedEvent.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!scrapedEvent) {
            console.warn(`Scraped event with ID ${req.params.id} not found.`);
            return res.status(404).json({ msg: 'Scraped event not found.' });
        }

        // If approved, create/update public event
        if (status === 'approved') {
            console.log(`[1/4] Event status is 'approved'. Starting public event creation for: "${scrapedEvent.title}"`);
            console.log(`[2/4] Parsing dateStr: '${scrapedEvent.date}' and timeStr: '${scrapedEvent.time}'`);

            const { start, end, success } = parseCunyDateTime(scrapedEvent.date, scrapedEvent.time);

            if (!success) {
                console.error(`❌ [ERROR] Date parsing FAILED for "${scrapedEvent.title}". Public event not created.`);
                return res.status(500).json({
                    msg: 'Status updated, but could not parse date to create public event.'
                });
            }

            console.log(`[3/4] Date parsing successful. Start: ${start}, End: ${end}`);

            const newPublicEvent = {
                title: scrapedEvent.title,
                description: `Event hosted by ${scrapedEvent.college}. More details at the source link.`,
                start,
                end,
                partnerName: scrapedEvent.college,
                location: 'See Source',
                sourceUrl: scrapedEvent.sourceUrl,
                isPublic: true,
                scrapedEventId: scrapedEvent._id
            };

            await Event.updateOne(
                { scrapedEventId: scrapedEvent._id },
                { $set: newPublicEvent },
                { upsert: true }
            );

            console.log(`✅ [4/4] SUCCESS: Public event created/updated in the main 'events' collection.`);
        }

        res.json(scrapedEvent);

    } catch (err) {
        console.error("--- ADMIN CRITICAL ERROR during event approval ---", err);
        res.status(500).send('Server Error');
    }
});

console.log('--- Finished defining admin routes. ---');
module.exports = router;
