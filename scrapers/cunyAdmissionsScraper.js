// // scrapers/cunyAdmissionsScraper.js
// const puppeteer = require('puppeteer');
// const mongoose = require('mongoose');
// const ScrapedEvent = require('../models/ScrapedEvent');

// async function scrapeCunyAdmissionsEvents(mongoUri) {
//     if (!mongoUri) {
//         throw new Error('MongoDB URI is required for the CUNY Admissions scraper.');
//     }

//     console.log('--- [Admissions Scraper] Starting ---');
    
//     // Database connection with error handling
//     try {
//         await mongoose.connect(mongoUri, {
//             connectTimeoutMS: 10000,
//             socketTimeoutMS: 45000
//         });
//         console.log('--- [Admissions Scraper] MongoDB connected.');
//     } catch (dbError) {
//         console.error('--- [Admissions Scraper] MongoDB connection failed:', dbError);
//         return { success: false, error: 'Database connection failed' };
//     }

//     // Browser setup with error handling
//     let browser;
//     try {
//         browser = await puppeteer.launch({
//             headless: true,
//             executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
//             args: ['--no-sandbox', '--disable-setuid-sandbox']
//         });
//     } catch (error) {
//         console.error('--- [Admissions Scraper] Browser launch failed:', error);
//         await mongoose.disconnect();
//         return { success: false, error: 'Failed to launch browser' };
//     }

//     const page = await browser.newPage();
//     await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
//     page.setDefaultTimeout(60000);

//     const targetUrl = 'https://www.cuny.edu/admissions/undergraduate/events/';
//     console.log(`--- [Admissions Scraper] Navigating to ${targetUrl}...`);

//     // Page navigation with error handling
//     try {
//         await page.goto(targetUrl, { 
//             waitUntil: 'domcontentloaded', 
//             timeout: 60000 
//         });
//         await page.waitForSelector('table tr td .event', { timeout: 30000 });
//     } catch (error) {
//         console.error('--- [Admissions Scraper] Page load failed:', error);
//         await browser.close();
//         await mongoose.disconnect();
//         return { success: false, error: 'Failed to load page or find events' };
//     }

//     // Scrape events from the page
//     let allEvents = [];
//     try {
//         allEvents = await page.evaluate(() => {
//             const events = [];
//             const eventNodes = document.querySelectorAll('table tr td .event').forEach(eventDiv => {
//                 const container = eventDiv.closest('td');
//                 if (!container) return;

//                 // Extract event details
//                 const titleElement = eventDiv.querySelector('h3 .cvc-v');
//                 const collegeElement = container.querySelector('.cvc-c');
//                 const dateElement = container.querySelector('.cvc-d');
//                 const typeElement = container.querySelector('.cvc-ht:contains("Event Type:") + .cvc-v');
//                 const modeElement = container.querySelector('.cvc-ht:contains("Mode:") + .cvc-v');
//                 const descriptionElement = Array.from(container.querySelectorAll('.cvc-v'))
//                     .find(el => !el.closest('h3') && !el.closest('.cvc-ht'));
//                 const linkElement = container.querySelector('.dt-links a');

//                 // Format date and time (assuming format "MM/DD/YYYY HH:MM AM/PM")
//                 const dateTimeString = dateElement?.textContent.trim() || '';
//                 const [datePart, timePart] = dateTimeString.split(/\s+(?=\d{1,2}:\d{2})/);
                
//                 events.push({
//                     title: titleElement?.textContent.trim() || 'No title',
//                     college: collegeElement?.textContent.trim() || 'CUNY Admissions',
//                     date: datePart || 'Date not specified',
//                     time: timePart || 'Time not specified',
//                     eventType: typeElement?.textContent.trim() || 'Not specified',
//                     mode: modeElement?.textContent.trim() || 'Not specified',
//                     description: descriptionElement?.textContent.trim() || '',
//                     sourceUrl: linkElement?.href || window.location.href
//                 });
//             });
//             return events;
//         });

//         console.log(`--- [Admissions Scraper] Found ${allEvents.length} events.`);
//     } catch (error) {
//         console.error('--- [Admissions Scraper] Scraping failed:', error);
//         await browser.close();
//         await mongoose.disconnect();
//         return { success: false, error: 'Failed to extract event data' };
//     }

//     // Database operations with detailed tracking
//     let stats = {
//         newEvents: 0,
//         updatedEvents: 0,
//         errors: 0
//     };

//     if (allEvents.length > 0) {
//         console.log('--- [Admissions Scraper] Saving events to database...');
        
//         for (const event of allEvents) {
//             try {
//                 const result = await ScrapedEvent.updateOne(
//                     { 
//                         sourceUrl: event.sourceUrl,
//                         date: event.date
//                     },
//                     { $set: event },
//                     { upsert: true }
//                 );
                
//                 if (result.upsertedCount > 0) {
//                     stats.newEvents++;
//                 } else if (result.modifiedCount > 0) {
//                     stats.updatedEvents++;
//                 }
//             } catch (error) {
//                 stats.errors++;
//                 if (error.code !== 11000) { // Skip duplicate key errors
//                     console.error('--- [Admissions Scraper] Error saving event:', error);
//                 }
//             }
//         }
//     }

//     console.log(`--- [Admissions Scraper] Database update complete.
//     New events: ${stats.newEvents}
//     Updated events: ${stats.updatedEvents}
//     Errors: ${stats.errors}`);

//     // Cleanup
//     await browser.close();
//     await mongoose.disconnect();
//     console.log('--- [Admissions Scraper] Finished. ---');

//     return { 
//         success: true, 
//         stats: {
//             totalFound: allEvents.length,
//             ...stats
//         }
//     };
// }

// module.exports = { scrapeCunyAdmissionsEvents };

// scrapers/cunyAdmissionsScraper.js (Refactored)

const puppeteer = require('puppeteer');

async function scrapeCunyAdmissionsEvents() {
    console.log('--- [Admissions Scraper] Starting ---');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    } catch (error) {
        console.error('--- [Admissions Scraper] Browser launch failed:', error);
        return { success: false, error: 'Failed to launch browser' };
    }

    const page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );
    page.setDefaultTimeout(60000);

    const targetUrl = 'https://www.cuny.edu/admissions/undergraduate/events/';
    console.log(`--- [Admissions Scraper] Navigating to ${targetUrl}...`);

    try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector('table tr td .event', { timeout: 30000 });
    } catch (error) {
        console.error('--- [Admissions Scraper] Page load failed:', error);
        await browser.close();
        return { success: false, error: 'Failed to load page or find events' };
    }

    let allEvents = [];
    try {
        allEvents = await page.evaluate(() => {
            const events = [];
            document.querySelectorAll('table tr td .event').forEach(eventDiv => {
                const container = eventDiv.closest('td');
                if (!container) return;

                const titleElement = eventDiv.querySelector('h3 .cvc-v');
                const collegeElement = container.querySelector('.cvc-c');
                const dateElement = container.querySelector('.cvc-d');
                const typeElement = Array.from(container.querySelectorAll('.cvc-ht'))
                    .find(el => el.textContent.includes("Event Type:"))?.nextElementSibling;
                const modeElement = Array.from(container.querySelectorAll('.cvc-ht'))
                    .find(el => el.textContent.includes("Mode:"))?.nextElementSibling;
                const descriptionElement = Array.from(container.querySelectorAll('.cvc-v'))
                    .find(el => !el.closest('h3') && !el.closest('.cvc-ht'));
                const linkElement = container.querySelector('.dt-links a');

                const dateTimeString = dateElement?.textContent.trim() || '';
                const [datePart, timePart] = dateTimeString.split(/\s+(?=\d{1,2}:\d{2})/);

                events.push({
                    title: titleElement?.textContent.trim() || 'No title',
                    college: collegeElement?.textContent.trim() || 'CUNY Admissions',
                    date: datePart || 'Date not specified',
                    time: timePart || 'Time not specified',
                    eventType: typeElement?.textContent.trim() || 'Not specified',
                    mode: modeElement?.textContent.trim() || 'Not specified',
                    description: descriptionElement?.textContent.trim() || '',
                    sourceUrl: linkElement?.href || window.location.href,
                    scrapedAt: new Date()
                });
            });
            return events;
        });

        console.log(`--- [Admissions Scraper] Found ${allEvents.length} events.`);
    } catch (error) {
        console.error('--- [Admissions Scraper] Scraping failed:', error);
        await browser.close();
        return { success: false, error: 'Failed to extract event data' };
    }

    await browser.close();
    console.log('--- [Admissions Scraper] Finished. ---');

    // Return the scraped data (no DB saving here)
    return allEvents;
}

module.exports = { scrapeCunyAdmissionsEvents };