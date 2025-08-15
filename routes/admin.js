// // routes/admin.js (Updated to call runAllScrapers without Mongo URI)

// const express = require('express');
// const router = express.Router();

// console.log('--- Loading routes/admin.js file ---');

// const authMiddleware = require('../middleware/auth');
// const adminAuth = require('../middleware/adminAuth');
// const { runAllScrapers } = require('../scrapers'); // <-- Updated import
// const ScrapedEvent = require('../models/ScrapedEvent');
// const Event = require('../models/Event');
// const { parseCunyDateTime } = require('../utils/dateParser');
// const ScrapeLog = require('../models/ScrapeLog');

// // -------------------------------------------------------------
// // @route   GET /api/admin/test
// // @desc    Simple test route
// // @access  Public (for quick sanity check only)
// // -------------------------------------------------------------
// router.get('/test', (req, res) => {
//     res.json({ message: 'Admin route is working!' });
// });

// // -------------------------------------------------------------
// // @route   POST /api/admin/scrape-events
// // @desc    Trigger all event scrapers
// // @access  Private (Admin only)
// // -------------------------------------------------------------
// router.post('/scrape-events', [authMiddleware, adminAuth], async (req, res) => {
//     console.log('Scrape request received from admin:', req.user?.email || 'Unknown User');

//     // Respond right away so the request doesn't hang
//     res.status(202).json({ msg: 'Scraping process for all sources has been started.' });

//     // Just call the runner. It handles everything internally.
//     runAllScrapers()
//         .then(() => console.log('✅ All scrapers completed.'))
//         .catch(err => {
//             console.error("--- SCRAPER RUNNER BACKGROUND ERROR ---", err);
//         });
// });

// // -------------------------------------------------------------
// // @route   GET /api/admin/scraped-events
// // @desc    Get all scraped events for review
// // @access  Private (Admin only)
// // -------------------------------------------------------------
// router.get('/scraped-events', [authMiddleware, adminAuth], async (req, res) => {
//     console.log('--- ADMIN: GET /scraped-events hit ---');
//     try {
//         const events = await ScrapedEvent.find().sort({ importedAt: -1 });
//         console.log(`Found ${events.length} scraped events`);
//         res.json(events);
//     } catch (err) {
//         console.error("Error fetching scraped events:", err);
//         res.status(500).send('Server Error');
//     }
// });

// // -------------------------------------------------------------
// // @route   PUT /api/admin/scraped-events/:id
// // @desc    Approve or reject a scraped event
// // @access  Private (Admin only)
// // -------------------------------------------------------------
// router.put('/scraped-events/:id', [authMiddleware, adminAuth], async (req, res) => {
//     console.log(`--- ADMIN: Received request to update event ${req.params.id} to status '${req.body.status}' ---`);
    
//     try {
//         const { status } = req.body;
//         if (!['approved', 'rejected'].includes(status)) {
//             console.warn(`Invalid status value: ${status}`);
//             return res.status(400).json({ msg: 'Invalid status.' });
//         }

//         const scrapedEvent = await ScrapedEvent.findByIdAndUpdate(
//             req.params.id,
//             { status },
//             { new: true }
//         );

//         if (!scrapedEvent) {
//             console.warn(`Scraped event with ID ${req.params.id} not found.`);
//             return res.status(404).json({ msg: 'Scraped event not found.' });
//         }

//         // If approved, create/update public event
//         if (status === 'approved') {
//             console.log(`[1/4] Event status is 'approved'. Starting public event creation for: "${scrapedEvent.title}"`);
//             console.log(`[2/4] Parsing dateStr: '${scrapedEvent.date}' and timeStr: '${scrapedEvent.time}'`);

//             const { start, end, success } = parseCunyDateTime(scrapedEvent.date, scrapedEvent.time);

//             if (!success) {
//                 console.error(`❌ [ERROR] Date parsing FAILED for "${scrapedEvent.title}". Public event not created.`);
//                 return res.status(500).json({
//                     msg: 'Status updated, but could not parse date to create public event.'
//                 });
//             }

//             console.log(`[3/4] Date parsing successful. Start: ${start}, End: ${end}`);

//             const newPublicEvent = {
//                 title: scrapedEvent.title,
//                 description: `Event hosted by ${scrapedEvent.college}. More details at the source link.`,
//                 start,
//                 end,
//                 partnerName: scrapedEvent.college,
//                 location: 'See Source',
//                 sourceUrl: scrapedEvent.sourceUrl,
//                 isPublic: true,
//                 scrapedEventId: scrapedEvent._id
//             };

//             await Event.updateOne(
//                 { scrapedEventId: scrapedEvent._id },
//                 { $set: newPublicEvent },
//                 { upsert: true }
//             );

//             console.log(`✅ [4/4] SUCCESS: Public event created/updated in the main 'events' collection.`);
//         }

//         res.json(scrapedEvent);

//     } catch (err) {
//         console.error("--- ADMIN CRITICAL ERROR during event approval ---", err);
//         res.status(500).send('Server Error');
//     }
// });

// // @route   GET /api/admin/scrape-history
// // @desc    Get the last few scrape jobs
// // @access  Private (Admin only)
// router.get('/scrape-history', [authMiddleware, adminAuth], async (req, res) => {
//     try {
//         // Fetch the 5 most recent logs, sorted from newest to oldest
//         const history = await ScrapeLog.find().sort({ startTime: -1 }).limit(5);
//         res.json(history);
//     } catch (err) {
//         res.status(500).send('Server Error');
//     }
// });

// console.log('--- Finished defining admin routes. ---');
// module.exports = router;


// routes/admin.js (Updated & Improved)

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const { scrapeCunyEvents } = require('../scrapers/cunyScraper'); // Adjust path if needed
const ScrapedEvent = require('../models/ScrapedEvent');
const Event = require('../models/Event');
const { parseCunyDateTime } = require('../utils/dateParser');
const ScrapeHistory = require('../models/ScrapeHistory'); // New history tracking model

// -------------------------------------------------------------
// @route   GET /api/admin/test
// @desc    Simple test route
// @access  Public (for sanity check)
// -------------------------------------------------------------
router.get('/test', (req, res) => {
    res.json({ message: 'Admin route is working!' });
});

// -------------------------------------------------------------
// @route   POST /api/admin/scrape-events
// @desc    Trigger the CUNY event scraper
// @access  Private (Admin only)
// -------------------------------------------------------------
router.post('/scrape-events', [authMiddleware, adminAuth], async (req, res) => {
    console.log('Scrape request received from admin:', req.user?.email || 'Unknown User');

    // Create a scrape history entry
    const historyLog = new ScrapeHistory({
        startTime: new Date(),
        status: 'running',
        triggeredBy: req.user?.email || 'Unknown User'
    });
    await historyLog.save();

    // Respond immediately so frontend doesn't hang
    res.status(202).json({
        msg: 'Scraping process started. This may take a few minutes.',
        historyId: historyLog._id
    });

    // Run scraper in background
    try {
        const result = await scrapeCunyEvents(process.env.MONGO_URI);

        historyLog.endTime = new Date();
        historyLog.status = 'completed';
        historyLog.stats = result?.stats || {};
        await historyLog.save();

        console.log('✅ Scraping completed successfully.');
    } catch (err) {
        console.error("--- SCRAPER BACKGROUND ERROR ---", err);
        historyLog.endTime = new Date();
        historyLog.status = 'failed';
        historyLog.error = err.message;
        await historyLog.save();
    }
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
        //console.log(`Found ${events.length} scraped events`);
        res.json(events);
    } catch (err) {
        console.error("Error fetching scraped events:", err.message);
        res.status(500).send('Server Error');
    }
});

// -------------------------------------------------------------
// @route   POST /api/admin/approve-all-pending
// @desc    Approve all pending scraped events
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
// @desc    Approve or reject a scraped event
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

        // If approved, create/update public event in main collection
        if (status === 'approved') {
            console.log(`[1/4] Approved: "${scrapedEvent.title}". Parsing date/time...`);

            const { start, end, success } = parseCunyDateTime(scrapedEvent.date, scrapedEvent.time);

            if (!success) {
                console.error(`❌ Failed to parse date/time for "${scrapedEvent.title}"`);
                return res.status(500).json({
                    msg: 'Status updated, but date parsing failed. Event not published.'
                });
            }

            console.log(`[2/4] Date parse success. Creating/updating public event...`);

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

            console.log(`✅ Public event saved for "${scrapedEvent.title}"`);
        }

        res.json(scrapedEvent);

    } catch (err) {
        console.error("Error updating scraped event status:", err.message);
        res.status(500).send('Server Error');
    }
});

// -------------------------------------------------------------
// @route   GET /api/admin/scrape-history
// @desc    Get the history of scrape jobs
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
