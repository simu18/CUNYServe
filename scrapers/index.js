// scrapers/index.js (Final Corrected Version)

const ScrapedEvent = require('../models/ScrapedEvent');
const { scrapeCunyEvents } = require('./cunyScraper');
const { scrapeCunyAdmissionsEvents } = require('./cunyAdmissionsScraper');

// --- Save Data Function ---
// This function now uses the existing Mongoose connection.
async function saveData(scraperName, scrapedData) {
    if (!Array.isArray(scrapedData) || scrapedData.length === 0) {
        console.log(`[${scraperName}] No new data to save.`);
        return { new: 0, updated: 0, failed: 0 };
    }

    const stats = { new: 0, updated: 0, failed: 0 };

    for (const event of scrapedData) {
        try {
            // Mongoose will use the connection established by server.js
            const result = await ScrapedEvent.updateOne(
                { sourceUrl: event.sourceUrl },
                { $set: event },
                { upsert: true }
            );

            if (result.upsertedCount > 0) stats.new++;
            else if (result.modifiedCount > 0) stats.updated++;
        } catch (error) {
            stats.failed++;
            if (error.code !== 11000) { // Ignore duplicate key errors
                console.error(`[${scraperName}] Error saving event:`, error);
            }
        }
    }

    console.log(`[${scraperName}] DB stats: ${JSON.stringify(stats)}`);
    return stats;
}

// --- Main Runner ---
// This function NO LONGER accepts a mongoUri parameter.
const runAllScrapers = async () => {
    console.log('--- [SCRAPER RUNNER] Starting all scrapers ---');

    // Run scrapers in parallel
    const [cunyEventsData, cunyAdmissionsData] = await Promise.all([
        scrapeCunyEvents().catch(error => {
            console.error('❌ [CUNY Events] Scraper threw a critical error:', error);
            return []; // Always return an empty array on failure
        }),
        scrapeCunyAdmissionsEvents().catch(error => {
            console.error('❌ [CUNY Admissions] Scraper threw a critical error:', error);
            return []; // Always return an empty array on failure
        })
    ]);

    console.log('--- [SCRAPER RUNNER] Finished scraping. Now saving data... ---');

    // Save scraped data using the main application's DB connection
    const cunyStats = await saveData('CUNY Events', cunyEventsData);
    const admissionsStats = await saveData('CUNY Admissions', cunyAdmissionsData);

    console.log('--- [SCRAPER RUNNER] All scrapers have finished their runs. ---');

    // Return the combined stats
    return { 
        stats: {
            cunyEvents: cunyStats,
            cunyAdmissions: admissionsStats
        } 
    };
};

module.exports = { runAllScrapers };