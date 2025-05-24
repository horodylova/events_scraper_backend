class WhatsOnLondonScraper extends BaseScraper {
    constructor() {
        super('WhatsOnLondon', 'https://www.whatsonlondon.co.uk');
    }

    async scrape(limit = null) {
        try {
            const html = await this.fetchDataWithBrightData('https://www.londonboxoffice.co.uk/all-london-shows');
            const $ = cheerio.load(html);
            const shows = [];

            $('.event-item, .listing-item').each((i, el) => {
                if (limit && shows.length >= limit) return false;

                const $el = $(el);
                const title = $el.find('h2, h3, .event-title').text().trim();
                const link = $el.find('a').attr('href');
                const venue = $el.find('.venue, .location').text().trim();
                const dates = $el.find('.dates, .event-dates').text().trim();
                const imageUrl = $el.find('img').attr('src');

                if (title && link) {
                    shows.push({
                        title: title,
                        fullPageUrl: this.buildFullUrl(link),
                        imageUrl: this.buildFullUrl(imageUrl),
                        venue: venue || null,
                        dates: dates || null,
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