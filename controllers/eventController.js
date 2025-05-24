const scraperService = require('../services/scraperService');

async function getAndScrapeEvents(req, res) {
    try {
        const events = await scraperService.scrapeWebsiteContent();
        res.status(200).json({
            message: 'Successfully scraped and parsed content from the target website!',
            events: events,
        });
    } catch (error) {
        console.error('Error in getAndScrapeEvents controller:', error.message);
        res.status(500).json({ message: 'Failed to fetch and parse content from the target website.', error: error.message });
    }
}

module.exports = {
    getAndScrapeEvents,
};
