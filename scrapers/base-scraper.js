const puppeteer = require('puppeteer-core'); 
const cheerio = require('cheerio');
const config = require('../config');

const { brightData } = config;

class BaseScraper {
    constructor(name, baseUrl) {
        this.name = name;
        this.baseUrl = baseUrl;
    }

    async fetchDataWithBrowser(url) {
        console.log(`[${this.name}] Connecting to Bright Data Browser API...`);
        let browser;
        try {
            browser = await puppeteer.connect({
                browserWSEndpoint: brightData.browserApiEndpoint,
                ignoreHTTPSErrors: true, 
                headless: true, 
            });
            console.log(`[${this.name}] Connected to browser! Navigating to site: ${url}`);
            const page = await browser.newPage();
            
           
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            console.log(`[${this.name}] Navigated! Waiting for page content...`);

         
            await page.waitForSelector('article.tile_article_14y0w_1, div[data-testid="recommended_testID"]', { timeout: 30000 });


            const html = await page.content();
            console.log(`[${this.name}] Successfully received HTML content via Browser API.`);
            return html;
        } catch (error) {
            console.error(`[${this.name}] Error fetching data with Browser API:`, error.message);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
                console.log(`[${this.name}] Browser closed.`);
            }
        }
    }
    
    async scrape(limit) {
        throw new Error('scrape method must be implemented by subclass');
    }

    buildFullUrl(relativeUrl) {
        if (!relativeUrl) return null;
        try {
            return new URL(relativeUrl, this.baseUrl).href;
        } catch (error) {
            console.error(`[${this.name}] Error building URL:`, error.message);
            return null;
        }
    }
}

module.exports = BaseScraper;


