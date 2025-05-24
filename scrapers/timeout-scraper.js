class TimeoutScraper extends BaseScraper {
    constructor() {
        super('TimeOut', 'https://www.timeout.com');
    }

    async scrape(limit = null) {
        try {
            const html = await this.fetchDataWithBrightData('https://www.timeout.com/london/theatre');
            const $ = cheerio.load(html);
            const shows = [];

           
            $('.card-list__item, .event-card').each((i, el) => {
                if (limit && shows.length >= limit) return false;

                const $el = $(el);
                const title = $el.find('h3, .event-card__title, .card__title').text().trim();
                const link = $el.find('a').attr('href');
                const imageUrl = $el.find('img').attr('src') || $el.find('img').attr('data-src');
                const rating = $el.find('.rating, .stars').text().trim();
                const price = $el.find('.price, .event-price').text().trim();

                if (title && link) {
                    shows.push({
                        title: title,
                        fullPageUrl: this.buildFullUrl(link),
                        imageUrl: this.buildFullUrl(imageUrl),
                        rating: rating || null,
                        price: price || null,
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