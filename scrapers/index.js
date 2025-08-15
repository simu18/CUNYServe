// scrapers/index.js (The Runner)

const mongoose = require('mongoose');
const ScrapedEvent = require('../models/ScrapedEvent'); // The runner needs the model
const { scrapeCunyEvents } = require('./cunyScraper');
const { scrapeCunyAdmissionsEvents } = require('./cunyAdmissionsScraper');

// This function will handle saving the data from any scraper
async function saveData(scraperName, scrapedData) {
    if (!scrapedData || scrapedData.length === 0) {
        console.log(`[${scraperName}] No new data to save.`);
        return { new: 0, updated: 0, failed: 0 };
    }

    const stats = { new: 0, updated: 0, failed: 0 };
    for (const event of scrapedData) {
        try {
            const result = await ScrapedEvent.updateOne(
                { sourceUrl: event.sourceUrl },
                { $set: event },
                { upsert: true }
            );
            if (result.upsertedCount > 0) stats.new++;
            else if (result.modifiedCount > 0) stats.updated++;
        } catch (error) {
            stats.failed++;
            if (error.code !== 11000) {
                console.error(`[${scraperName}] Error saving event:`, error);
            }
        }
    }
    console.log(`[${scraperName}] DB stats: ${JSON.stringify(stats)}`);
    return stats;
}

// The main function that controls the entire process
const runAllScrapers = async () => {
    console.log('--- [SCRAPER RUNNER] Starting all scrapers ---');
    
    // Run scrapers in parallel for speed
    const [cunyEventsData, cunyAdmissionsData] = await Promise.all([
        scrapeCunyEvents(ScrapedEvent).catch(e => { console.error("CUNY Events scraper failed", e); return []; }),
        scrapeCunyAdmissionsEvents(ScrapedEvent).catch(e => { console.error("CUNY Admissions scraper failed", e); return []; })
    ]);

    console.log(`--- [SCRAPER RUNNER] Finished scraping. Now saving data... ---`);
    
    // Save the data from both scrapers
    await saveData('CUNY Events', cunyEventsData);
    await saveData('CUNY Admissions', cunyAdmissionsData);

    console.log('--- [SCRAPER RUNNER] All scrapers have finished. ---');
};

module.exports = { runAllScrapers };