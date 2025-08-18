// scrapers/cunyAdmissionsScraper.js (Improved + Robust + Full Fields)
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
    } catch (e) {
        console.error("❌ [Admissions Scraper] Browser launch failed:", e.message);
        return [];
    }

    const page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );
    page.setDefaultTimeout(90000);

    const targetUrl = 'https://www.cuny.edu/admissions/undergraduate/events/';
    console.log(`--- [Admissions Scraper] Navigating to ${targetUrl}...`);

    try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });

        // Try modern selector first, fallback to legacy one
        let events = [];
        try {
            await page.waitForSelector('.event-item, table tr td .event', { timeout: 30000 });

            events = await page.evaluate(() => {
                const results = [];

                // Modern format: .event-item blocks
                document.querySelectorAll('.event-item').forEach(el => {
                    const titleEl = el.querySelector('h3 a');
                    const dateEl = el.querySelector('.event-date');

                    results.push({
                        title: titleEl?.innerText.trim() || 'No title',
                        college: 'CUNY Admissions',
                        date: dateEl?.innerText.trim() || 'Date not specified',
                        time: 'See Source',
                        eventType: 'Not specified',
                        mode: 'Not specified',
                        description: '',
                        sourceUrl: titleEl?.href || window.location.href,
                        scrapedAt: new Date()
                    });
                });

                // Legacy format: table layout with .event class
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

                    results.push({
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

                return results;
            });
        } catch (innerErr) {
            console.error("⚠️ [Admissions Scraper] No valid event selector found:", innerErr.message);
        }

        console.log(`✅ [Admissions Scraper] Found ${events.length} events.`);
        await browser.close();
        console.log('--- [Admissions Scraper] Finished ---');
        return events;

    } catch (error) {
        console.error('⚠️ [Admissions Scraper] Error during navigation/scraping:', error.message);
        await browser.close();
        return [];
    }
}

module.exports = { scrapeCunyAdmissionsEvents };
