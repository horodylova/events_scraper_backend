const BaseScraper = require('./base-scraper');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const config = require('../config');

class LondonTheatreScraper extends BaseScraper {
    constructor() {
        super('LondonTheatre', 'https://www.londontheatre.co.uk');
    }

    async scrape(limit = null) {
        try {
            console.log(`[${this.name}] Starting browser-based scraping...`);
            
           
            const browser = await puppeteer.connect({
                browserWSEndpoint: config.brightData.browserApiEndpoint || process.env.BRIGHT_DATA_BROWSER_WS,
            });
            
            console.log(`[${this.name}] Connected to browser! Navigating to site...`);
            const page = await browser.newPage();
            
           
            await page.goto('https://www.londontheatre.co.uk/whats-on', { 
                waitUntil: "domcontentloaded", 
                timeout: 15000 
            });
            
            console.log(`[${this.name}] Page loaded! Waiting for content...`);
            
            await page.waitForSelector('div[data-test-id^="poster-"]', { timeout: 15000 });
            
            const html = await page.content();
             
            await browser.close();
             
            const $ = cheerio.load(html);
            const shows = [];
             
            const showElements = $('div[data-test-id^="poster-"]');
            console.log(`[${this.name}] Found ${showElements.length} potential show elements`);

            showElements.each((i, el) => {
                if (limit && shows.length >= limit) return false;

                const titleElement = $(el).find('p[data-test-id^="product-"]');
                const title = titleElement.text().trim();
                const relativeUrl = titleElement.closest('a').attr('href');
                const imageUrl = $(el).find('img').attr('src');

                if (title && relativeUrl) {
                    shows.push({
                        title: title,
                        fullPageUrl: this.buildFullUrl(relativeUrl),
                        imageUrl: this.buildFullUrl(imageUrl),
                        source: this.name,
                        scrapedAt: new Date().toISOString()
                    });
                }
            });

            console.log(`[${this.name}] Parsed ${shows.length} shows.`);
            return shows;
        } catch (error) {
            console.error(`[${this.name}] Error in scrape:`, error.message);
            throw error;
        }
    }
}

module.exports = LondonTheatreScraper;