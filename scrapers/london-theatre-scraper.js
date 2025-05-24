const BaseScraper = require('./base-scraper');
const cheerio = require('cheerio');

class LondonTheatreScraper extends BaseScraper {
    constructor() {
        super('LondonTheatre', 'https://www.londontheatre.co.uk');
    }

    async scrape(limit = null) {
        try {
            const html = await this.fetchDataWithBrightData('https://www.londontheatre.co.uk/whats-on');
            const $ = cheerio.load(html);
            const shows = [];

            $('div[data-test-id^="poster-"]').each((i, el) => {
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