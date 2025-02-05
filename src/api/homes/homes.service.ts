import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import userAgent from 'user-agents';
import { humanLikeDelay, readCityHomesFile, writeCityHomesFile } from '../../helper/index.helper';

puppeteer.use(StealthPlugin());

const BASE_URL = 'https://www.remax.com';

export async function scrapeHomes(city: string): Promise<any[]> {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--disable-http2', // Force HTTP/1.1
            '--disable-features=site-per-process',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
    });
    const page = await browser.newPage();
    await page.setUserAgent(userAgent.toString());

    await humanLikeDelay(page);
    // Go to home website
    await page.goto(BASE_URL);
    await page.waitForSelector('input[data-test="autocomplete-input"]');
    await humanLikeDelay(page);
    // Search for homes in the specified city
    await page.type('input[data-test="autocomplete-input"]', city);
    await humanLikeDelay(page);
    await page.keyboard.press('Enter');
    await humanLikeDelay(page);
    await page.waitForSelector('.d-container .d-listing-card-details', {
        visible: true,
        timeout: 60000
    });
    console.log('home list render, start scraping');

    const listings = [];
    let hasNextPage = true;
    let pageNum = 1;

    while (hasNextPage) {
        const pageListings = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.d-container .d-listing-card-details'));
            return cards.map(card => ({
                price: card.querySelector('.d-listing-card-price')?.textContent?.trim(),
                address: card.querySelector('a')?.getAttribute('aria-label')?.trim(),
                beds: card.querySelector('.d-listing-card-stats > p:first-child > strong')?.textContent?.trim(),
                baths: card.querySelector('.d-listing-card-stats > p:nth-child(2) > strong')?.textContent?.trim(),
                sqft: card.querySelector('.d-listing-card-stats > p:nth-child(3) > strong')?.textContent?.trim(),
                link: card.querySelector('a')?.getAttribute('href')
            }));
        });
        pageListings.forEach(listing => {
            listing['address'] = listing['address']?.split(" ").slice(3).join(" ")
            listing['link'] = BASE_URL + listing['link']
        })
        listings.push(...pageListings);

        // Check if there's a next page
        const disabledNextButton = await page.$('button.right[disabled]');
        const nextButton = await page.$('button[aria-label="Next Page"]');
        if (nextButton && !disabledNextButton) {
            // go next page and scrape home list
            await humanLikeDelay(page);
            await nextButton.click();
            await page.waitForSelector('.d-container .d-listing-card-details');
            pageNum++;
        } else {
            // in the end of pagination, stop
            hasNextPage = false;
        }
    }

    console.log('extract child page of home for details');

    // Get details from individual listing pages
    for (const listing of listings) {
        if (listing.link) {
            await humanLikeDelay(page);
            await page.goto(listing.link);
            await page.waitForSelector('.listing-template-main');

            const details = await page.evaluate(() => {
                // extract home built year info
                let yearBuilt = '';
                const yearBuiltElem = Array.from(document.querySelectorAll('p.d-listing-details-main-feature-text'))
                    .find(p => p.textContent?.trim().includes('Built in'));
                if (yearBuiltElem) {
                    yearBuilt = yearBuiltElem?.textContent?.trim() || '';
                }

                return {
                    description: document.querySelector('p[data-testid="d-listing-remarks"]')?.textContent?.trim(),
                    yearBuilt
                };
            });
            Object.assign(listing, { children: details });
        }
    }

    const data = JSON.stringify(listings);
    try {
        await writeCityHomesFile(city, data);
    } catch (err) {
        console.error('save homes into file error:', err)
    }

    await browser.close();
    return listings;
}

export async function readHomeList(city: string, page: string | undefined, pageSize: string | undefined): Promise<any> {
    try {
        const data = await readCityHomesFile(city);
        let pageData = data;
        if (page && pageSize) {
            const startIndex = parseInt(page) * parseInt(pageSize);
            const endIndex = (parseInt(page) + 1) * parseInt(pageSize);
            if (startIndex > data.length) return [];
            pageData = data.slice(startIndex, endIndex <= data.length ? endIndex : data.length);
        }
        return pageData;
    } catch (error) {
        throw error; // Re-throw other errors
    }
}