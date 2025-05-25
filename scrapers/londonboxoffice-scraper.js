const BaseScraper = require('./base-scraper');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const config = require('../config');

class LondonBoxOfficeScraper extends BaseScraper {
    constructor() {
        super('LondonBoxOffice', 'https://www.londonboxoffice.co.uk');
    }

    async scrape(limit = null) {
        try {
            console.log(`[${this.name}] Starting browser-based scraping...`);
            
            const browser = await puppeteer.connect({
                browserWSEndpoint: config.brightData.browserApiEndpoint || process.env.BRIGHT_DATA_BROWSER_WS,
            });
            
            console.log(`[${this.name}] Connected to browser! Navigating to site...`);
            const page = await browser.newPage();
            
            await page.goto('https://www.londonboxoffice.co.uk/all-london-shows', { 
                waitUntil: "domcontentloaded", 
                timeout: 15000  
            });
            
            console.log(`[${this.name}] Page loaded! Waiting for content...`);
             
            await page.waitForSelector('div.listitem', { timeout: 15000 });  
            
         
            await new Promise(r => setTimeout(r, 3000));  
            
            const html = await page.content();
            console.log(`[${this.name}] HTML content retrieved, length: ${html.length}`);
            
            await browser.close();
            
            const $ = cheerio.load(html);
            const shows = [];
 
            const showElements = $('div.listitem');
            console.log(`[${this.name}] Found ${showElements.length} potential show elements using 'div.listitem'`);

            showElements.each((i, el) => {
                if (limit && shows.length >= limit) return false;

                const $el = $(el);

                const title = $el.find('h3 a').text().trim();
                const link = $el.find('h3 a').attr('href');
               
                let price = $el.attr('data-price');
                if (price) {
                    price = `£${price}.00`; 
                } else {
                    price = $el.find('span.from strong').text().trim();
                }
                if (!price) {
                     const priceText = $el.find('span.from').text().trim();
                     const priceMatch = priceText.match(/£\d+\.\d+/);
                     if (priceMatch) price = priceMatch[0];
                }
 
                const venue = $el.find('p.loc.mo').text().trim() || null; 
               
                const description = $el.find('div.desc p').text().trim() || null;

                let bookingUntilDate = null;  
                const bookingUntilElement = $el.find('.booking-until');  
                if (bookingUntilElement.length) {
                    bookingUntilDate = bookingUntilElement.text().replace('Booking until:', '').trim();
                }
                
                let imageUrl = $el.find('div.poster img').attr('src');

                if (title && (link || venue)) {
                    shows.push({
                        title: title,
                        fullPageUrl: link ? this.buildFullUrl(link) : null,
                        imageUrl: imageUrl ? this.buildFullUrl(imageUrl) : null,
                        price: price,
                        venue: venue,
                        description: description,  
                        bookingUntil: bookingUntilDate,
                        source: this.name,
                        scrapedAt: new Date().toISOString()
                    });
                }
            });

            console.log(`[${this.name}] Parsed ${shows.length} shows.`);
            if (shows.length === 0) {
                console.log(`[${this.name}] No shows parsed. HTML snapshot for review (first 5000 chars):`);
                console.log(html.substring(0, 5000));
            }
            return shows;
        } catch (error) {
            console.error(`[${this.name}] Error in scrape:`, error.message);
            if (error.pageContent) {
                console.error(`[${this.name}] Page content at the time of error (first 2000 chars):`, error.pageContent.substring(0,2000));
            }
            throw error;
        }
    }
}

module.exports = LondonBoxOfficeScraper;

