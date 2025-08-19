
const puppeteer = require('puppeteer');

async function scrapeCunyEvents() {
    console.log('🚀 [CUNY Events] Launching headless browser...');
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    } catch (e) {
        console.error("❌ PUPPETEER LAUNCH FAILED in cunyScraper:", e);
        return [];
    }

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
    page.setDefaultTimeout(90000);

    const targetUrl = 'https://events.cuny.edu/';
    console.log(`📡 [CUNY Events] Navigating to ${targetUrl}...`);

    try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    } catch (error) {
        console.error(`❌ [CUNY Events] Failed to load initial page:`, error.message);
        await browser.close();
        return [];
    }

    let allEvents = [];
    const maxPagesToScrape = 10;

    for (let currentPage = 1; currentPage <= maxPagesToScrape; currentPage++) {
        console.log(`🔍 [CUNY Events] Scraping page ${currentPage}...`);

        try {
            console.log("--- [CUNY Events] Waiting for selector: 'ul.cec-list' ---");
            await page.waitForSelector('ul.cec-list', { timeout: 30000 });
            console.log("--- [CUNY Events] Selector 'ul.cec-list' found! ---");

            const pageEvents = await page.evaluate(() => {
                const eventNodes = document.querySelectorAll('li.cec-list-item');
                const eventData = [];
                eventNodes.forEach(node => {
                    const titleElement = node.querySelector('h2.low a');
                    const collegeElement = node.querySelector('h4.low-normal:nth-of-type(1)');
                    const dateElement = node.querySelector('h4.low-normal:nth-of-type(2)');
                    const timeElement = node.querySelector('h4:not(.low-normal)');
                    const link = titleElement?.href;

                    if (titleElement && dateElement && link) {
                        eventData.push({
                            title: titleElement.innerText.trim(),
                            college: collegeElement?.innerText.trim() || 'Not specified',
                            date: dateElement.innerText.trim(),
                            time: timeElement?.innerText.trim() || 'Not specified',
                            sourceUrl: link
                        });
                    }
                });
                return eventData;
            });

            if (pageEvents.length === 0) {
                console.log('--- [CUNY Events] No events found on this page. Ending scrape.');
                break;
            }

            allEvents.push(...pageEvents);
            console.log(`✅ [CUNY Events] Found ${pageEvents.length} events on page ${currentPage}. Total so far: ${allEvents.length}`);

            // The pagination link for "next" is 'div.pagination a[href*="page/2"]' or similar
            // A more general selector is one that is not the 'prev' link and not the 'current' page.
            const nextButton = await page.$('div.pagination a:not([class="disabled"]):not([class="current"])');
            
            // A simpler, more direct selector for the "next" link text
            const nextLink = await page.evaluateHandle(() => {
                const links = Array.from(document.querySelectorAll('div.pagination a'));
                return links.find(a => a.innerText.trim().toLowerCase() === 'next');
            });
            
            const nextButtonElement = nextLink.asElement();

            if (nextButtonElement) {
                console.log(`➡️ [CUNY Events] Clicking next page button...`);
                await Promise.all([
                    nextButtonElement.click(),
                    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 90000 })
                ]);
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                console.log('--- [CUNY Events] No more "Next" button found. Ending scrape.');
                break;
            }
        } catch (error) {
            console.error(`⚠️ [CUNY Events] Error on page ${currentPage}. Ending scrape for this source. Error:`, error.message);
            const screenshotPath = `debug_screenshot_page_${currentPage}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`📸 Screenshot of the failed page has been saved to: ${screenshotPath}`);
            break;
        }
    }

    console.log(`✅ [CUNY Events] Final extraction complete. Found ${allEvents.length} total events.`);
    await browser.close();
    console.log('🏁 [CUNY Events] Scraper finished.');

    return allEvents;
}

module.exports = { scrapeCunyEvents };