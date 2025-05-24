const scraperService = require('../services/scraperService');

async function getAndScrapeEvents(req, res) {
    try {
        const htmlContent = await scraperService.scrapeMuseumEvents();
        res.status(200).send(`
            <h1>Successfully scraped data from British Museum!</h1>
            <p>Here's a snippet of the HTML:</p>
            <pre>${htmlContent.substring(0, 1000)}</pre>
            <p>This confirms Bright Data proxy is working and fetching content.</p>
        `);
    } catch (error) {
        console.error('Error in getAndScrapeEvents controller:', error.message);
        res.status(500).json({ message: 'Failed to fetch events from British Museum.', error: error.message });
    }
}

module.exports = {
    getAndScrapeEvents,
};