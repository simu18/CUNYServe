

const ScrapedEvent = require('../models/ScrapedEvent');
const { scrapeCunyEvents } = require('./cunyScraper');
const { scrapeCunyAdmissionsEvents } = require('./cunyAdmissionsScraper');
const { scrapeNycServiceEvents } = require('./nycServiceScraper'); // <-- New Scraper

// --- Save Data Function ---
// Uses the existing Mongoose connection from server.js
async function saveData(scraperName, scrapedData) {
    if (!Array.isArray(scrapedData) || scrapedData.length === 0) {
        console.log(`[${scraperName}] No new data to save.`);
        return { new: 0, updated: 0, failed: 0 };
    }

    const stats = { new: 0, updated: 0, failed: 0 };

    for (const event of scrapedData) {
        try {
            const result = await ScrapedEvent.updateOne(
                { sourceUrl: event.sourceUrl }, // Unique identifier
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
// Runs all scrapers in parallel and saves their data
const runAllScrapers = async () => {
    console.log('--- [SCRAPER RUNNER] Starting all scrapers ---');

    const [
        cunyEventsData, 
        cunyAdmissionsData,
        nycServiceData
    ] = await Promise.all([
        scrapeCunyEvents().catch(error => {
            console.error('❌ [CUNY Events] Scraper threw a critical error:', error);
            return [];
        }),
        scrapeCunyAdmissionsEvents().catch(error => {
            console.error('❌ [CUNY Admissions] Scraper threw a critical error:', error);
            return [];
        }),
        scrapeNycServiceEvents().catch(error => {
            console.error('❌ [NYC Service] Scraper threw a critical error:', error);
            return [];
        })
    ]);

    console.log('--- [SCRAPER RUNNER] Finished scraping. Now saving data... ---');

    const cunyStats = await saveData('CUNY Events', cunyEventsData);
    const admissionsStats = await saveData('CUNY Admissions', cunyAdmissionsData);
    const nycServiceStats = await saveData('NYC Service', nycServiceData);

    console.log('--- [SCRAPER RUNNER] All scrapers have finished their runs. ---');

    return { 
        stats: {
            cunyEvents: cunyStats,
            cunyAdmissions: admissionsStats,
            nycService: nycServiceStats
        }
    };
};

module.exports = { runAllScrapers };
