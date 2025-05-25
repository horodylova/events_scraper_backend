const BaseScraper = require('./base-scraper');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-core');

class LondonBoxOfficeScraper extends BaseScraper {
    constructor() {
        super('LondonBoxOffice', 'https://www.londonboxoffice.co.uk');
    }

    async scrape(limit = null) {
        try {
            console.log(`[${this.name}] Starting browser-based scraping...`);
            
            const html = await this.fetchDataWithBrowser('https://www.londonboxoffice.co.uk/all-london-shows');
            
            const $ = cheerio.load(html);
            const shows = [];

            $('div.listing-item').each((i, el) => {
                if (limit && shows.length >= limit) return false;

                const $el = $(el);

                const title = $el.find('.title a').text().trim();
                const link = $el.find('.title a').attr('href');
                
                const priceElement = $el.find('.price');
                const price = priceElement.text().trim() || null;

                const venue = $el.find('.location').text().trim() || null; 
                
                let bookingUntilDate = null;
                const bookingUntilElement = $el.find('.booking-until');
                if (bookingUntilElement.length) {
                    bookingUntilDate = bookingUntilElement.text().replace('Booking until:', '').trim();
                }
                
                let imageUrl = $el.find('.thumb-image img').attr('src');
                if (!imageUrl) {
                    imageUrl = $el.find('.image img').attr('src');
                }

                if (title && link) {
                    shows.push({
                        title: title,
                        fullPageUrl: this.buildFullUrl(link),
                        imageUrl: this.buildFullUrl(imageUrl),
                        price: price,
                        venue: venue,
                        bookingUntil: bookingUntilDate,
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

module.exports = LondonBoxOfficeScraper;

