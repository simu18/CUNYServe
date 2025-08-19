// routes/admin.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Import all necessary models and utilities
const { runAllScrapers } = require('../scrapers'); // Master runner for all scrapers
const ScrapedEvent = require('../models/ScrapedEvent');
const Event = require('../models/Event');
const { parseCunyDateTime } = require('../utils/dateParser');
const ScrapeHistory = require('../models/ScrapeHistory');

// -------------------------------------------------------------
// @route   POST /api/admin/scrape-events
// @desc    Trigger all scrapers to run in the background
// @access  Private (Admin only)
// -------------------------------------------------------------
router.post('/scrape-events', [authMiddleware, adminAuth], async (req, res) => {
    console.log('Scrape request received from admin:', req.user?.email || 'Unknown User');

    // Create a history log to track this run
    const historyLog = new ScrapeHistory({
        startTime: new Date(),
        status: 'running',
        triggeredBy: req.user?.email || 'System'
    });
    await historyLog.save();

    // Immediately respond to the user so their browser doesn't time out
    res.status(202).json({
        msg: 'Scraping process has been started. This may take a few minutes to complete.',
        historyId: historyLog._id
    });

    // Run the scraper in the background. It will use the main server's DB connection.
    // We do NOT connect or disconnect from the database here.
    runAllScrapers()
        .then(result => {
            historyLog.endTime = new Date();
            historyLog.status = 'completed';
            historyLog.stats = result?.stats || {};
            return historyLog.save();
        })
        .then(() => console.log('✅ All scrapers completed successfully and history was updated.'))
        .catch(err => {
            console.error("--- SCRAPER BACKGROUND ERROR ---", err);
            historyLog.endTime = new Date();
            historyLog.status = 'failed';
            historyLog.error = err.message;
            return historyLog.save();
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
        const events = await ScrapedEvent.find().sort({ importedAt: -1 }).lean();
        console.log(`--- API Route: Found ${events.length} scraped events in the database. ---`);
        res.json(events);
    } catch (err) {
        console.error("Error fetching scraped events:", err.message);
        res.status(500).send('Server Error');
    }
});

// -------------------------------------------------------------
// @route   POST /api/admin/approve-all-pending
// @desc    Approve all 'unverified' scraped events
// @access  Private (Admin only)
// -------------------------------------------------------------
router.post('/approve-all-pending', [authMiddleware, adminAuth], async (req, res) => {
    try {
        const result = await ScrapedEvent.updateMany(
            { status: 'unverified' },
            { $set: { status: 'approved' } }
        );
        res.json({ msg: `All pending events approved (${result.modifiedCount} updated).` });
    } catch (err) {
        console.error("Error approving all pending events:", err.message);
        res.status(500).send('Server Error');
    }
});

// -------------------------------------------------------------
// @route   PUT /api/admin/scraped-events/:id
// @desc    Approve or reject a single scraped event
// @access  Private (Admin only)
// -------------------------------------------------------------
router.put('/scraped-events/:id', [authMiddleware, adminAuth], async (req, res) => {
    console.log(`--- ADMIN: Update event ${req.params.id} to status '${req.body.status}' ---`);
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status.' });
        }

        const scrapedEvent = await ScrapedEvent.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!scrapedEvent) {
            return res.status(404).json({ msg: 'Scraped event not found.' });
        }

        if (status === 'approved') {
            console.log(`[1/3] Approved: "${scrapedEvent.title}". Parsing date/time...`);
            const { start, end, success } = parseCunyDateTime(scrapedEvent.date, scrapedEvent.time);

            if (!success) {
                console.error(`❌ Failed to parse date/time for "${scrapedEvent.title}"`);
                return res.status(500).json({
                    msg: 'Status updated, but date parsing failed. Event not published.'
                });
            }

            console.log(`[2/3] Date parse success. Creating/updating public event...`);

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

            console.log(`[3/3] ✅ Public event saved for "${scrapedEvent.title}"`);
        }

        res.json(scrapedEvent);
    } catch (err) {
        console.error("Error updating scraped event status:", err.message);
        res.status(500).send('Server Error');
    }
});

// -------------------------------------------------------------
// @route   GET /api/admin/scrape-history
// @desc    Get recent scrape history logs
// @access  Private (Admin only)
// -------------------------------------------------------------
router.get('/scrape-history', [authMiddleware, adminAuth], async (req, res) => {
    try {
        const history = await ScrapeHistory.find().sort({ startTime: -1 }).limit(10).lean();
        res.json(history);
    } catch (err) {
        console.error("Error fetching scrape history:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;