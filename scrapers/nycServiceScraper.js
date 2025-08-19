
const puppeteer = require('puppeteer');

async function scrapeNycServiceEvents() {
    console.log('🚀 [NYC Service] Launching browser to intercept API calls...');
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    } catch (e) {
        console.error("❌ PUPPETEER LAUNCH FAILED in nycServiceScraper:", e);
        return [];
    }

    const page = await browser.newPage();
    page.setDefaultTimeout(90000);

    const apiUrl = 'https://www.nycservice.org/search/getOpportunitiesCalendar';
    let capturedEvents = []; // We will store the results here

    // --- THIS IS THE KEY ---
    // Tell Puppeteer to listen for all network responses.
    page.on('response', async (response) => {
        // Check if the response URL is the one we're interested in.
        if (response.url() === apiUrl && response.request().method() === 'POST') {
            console.log('✅ [NYC Service] Intercepted the correct API response!');
            try {
                const data = await response.json();
                if (data && data.items) {
                    // Process the JSON data just like we did with axios
                    data.items.forEach(day => {
                        if (day.occurrences && day.occurrences.length > 0) {
                            day.occurrences.forEach(occ => {
                                capturedEvents.push({
                                    title: occ.opportunityName,
                                    college: occ.organizationServedName,
                                    date: new Date(occ.startDateTimeISO).toLocaleDateString('en-US', {
                                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                    }),
                                    time: `${occ.startTime} - ${occ.endTime}`,
                                    sourceUrl: occ.opportunityLink
                                });
                            });
                        }
                    });
                    console.log(`--- [NYC Service] Captured ${capturedEvents.length} events so far... ---`);
                }
            } catch (err) {
                console.error(`⚠️ [NYC Service] Failed to parse JSON from API response:`, err);
            }
        }
    });

    const targetUrl = 'https://www.nycservice.org/calendar';
    console.log(`📡 [NYC Service] Navigating to ${targetUrl} to trigger API call...`);

    try {
        
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        console.log('--- [NYC Service] Page loaded. Waiting for API interception to complete... ---');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    } catch (error) {
        console.error(`❌ [NYC Service] An error occurred during page navigation:`, error.message);
    }

    console.log(`✅ [NYC Service] Final extraction complete. Found a total of ${capturedEvents.length} events.`);
    await browser.close();
    console.log('🏁 [NYC Service] Scraper finished.');

    return capturedEvents;
}

module.exports = { scrapeNycServiceEvents };