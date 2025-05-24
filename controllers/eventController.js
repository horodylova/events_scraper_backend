const { TheatreDataAggregator } = require('../scrapers/index');
const dataService = require('../data/eventStorage');

async function getAndScrapeEvents(req, res) {
    try {
        const aggregator = new TheatreDataAggregator();
        const results = await aggregator.scrapeAll();
        await dataService.saveNewEvents(results.shows);
        
        res.status(200).json({
            message: 'Successfully scraped, saved, and parsed content from London Theatre!',
            events: results.shows,
            summary: {
                totalSources: results.totalSources,
                successfulSources: results.successfulSources,
                totalShows: results.shows.length,
                errors: results.errors
            }
        });
    } catch (error) {
        console.error('Error in getAndScrapeEvents controller:', error.message);
        res.status(500).json({ message: 'Failed to fetch and save content from the target website.', error: error.message });
    }
}

module.exports = {
    getAndScrapeEvents
};