const BaseScraper = require('./base-scraper');
 const LondonTheatreScraper = require('./london-theatre-scraper.js');
const TimeoutScraper = require('./timeout-scraper.js');

class TheatreDataAggregator {
    constructor() {
        
        this.scrapers = [
    
            new LondonTheatreScraper(),
            new TimeoutScraper()
        ];
    }

    async scrapeAll(limit = null) {
        const results = {
            shows: [],
            reviews: [],
            totalSources: this.scrapers.length,
            successfulSources: 0,
            errors: []
        };

        const scrapePromises = this.scrapers.map(async (scraper) => {
            try {
                const data = await scraper.scrape(limit);
                results.successfulSources++;
                 
                if (scraper.name === 'TimeOut') {
                    
                    results.reviews.push(...data);
                } else {
                     
                    results.shows.push(...data);
                }
                
                return { source: scraper.name, success: true, count: data.length };
            } catch (error) {
                results.errors.push({
                    source: scraper.name,
                    error: error.message
                });
                return { source: scraper.name, success: false, error: error.message };
            }
        });

        const scrapeResults = await Promise.allSettled(scrapePromises);
        
        console.log(`\n=== SCRAPING SUMMARY ===`);
        console.log(`Total sources: ${results.totalSources}`);
        console.log(`Successful sources: ${results.successfulSources}`);
        console.log(`Total shows: ${results.shows.length}`);
        console.log(`Total reviews: ${results.reviews.length}`);
        console.log(`Errors: ${results.errors.length}`);
        
        return results;
    }

    async scrapeSpecificSource(sourceName, limit = null) {
        const scraper = this.scrapers.find(s => s.name.toLowerCase() === sourceName.toLowerCase());
        if (!scraper) {
            throw new Error(`Scraper for source "${sourceName}" not found`);
        }
        
        return await scraper.scrape(limit);
    }
}

module.exports = {
    BaseScraper,
   
    LondonTheatreScraper,
    TimeoutScraper,
    TheatreDataAggregator
};