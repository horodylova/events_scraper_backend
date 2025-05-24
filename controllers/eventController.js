const scraperService = require('../services/scraperService');
const dataService = require('../data/eventStorage');

async function getAndScrapeEvents(req, res) {
    try {
        const events = await scraperService.scrapeWebsiteContent();
        await dataService.saveNewEvents(events);
        res.status(200).json({
            message: 'Successfully scraped, saved, and parsed content from the target website!',
            events: events,
        });
    } catch (error) {
        console.error('Error in getAndScrapeEvents controller:', error.message);
        res.status(500).json({ message: 'Failed to fetch and save content from the target website.', error: error.message });
    }
}

module.exports = {
    getAndScrapeEvents
};