const fs = require('fs').promises;
const path = require('path');

const SHOWS_DATA_PATH = path.join(__dirname, '..', 'data', 'shows.json');
const REVIEWS_DATA_PATH = path.join(__dirname, '..', 'data', 'reviews.json');

async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`JSON file not found: ${filePath}. Returning empty array.`);
            return [];
        }
        console.error(`Error reading or parsing ${filePath}:`, error);
        throw error;
    }
}

async function getAllShows(req, res) {
    try {
        const shows = await readJsonFile(SHOWS_DATA_PATH);
        res.status(200).json(shows);
    } catch (error) {
        console.error('Error fetching all shows:', error);
        res.status(500).json({ message: 'Failed to retrieve shows data.', error: error.message });
    }
}

async function getShowDetails(req, res) {
    try {
        const showTitle = req.query.title;
        if (!showTitle) {
            return res.status(400).json({ message: "Parameter 'title' is required." });
        }

        const allShows = await readJsonFile(SHOWS_DATA_PATH);
        const showDetails = allShows.find(show =>
            show.title && show.title.toLowerCase() === showTitle.toLowerCase()
        );

        if (!showDetails) {
            return res.status(404).json({ message: `Show with title '${showTitle}' not found.` });
        }

        res.status(200).json(showDetails);
    } catch (error) {
        console.error('Error fetching show details:', error);
        res.status(500).json({ message: 'Failed to retrieve show details.', error: error.message });
    }
}

async function getReviewsByShowTitle(req, res) {
    try {
        const showTitle = req.query.title;
        if (!showTitle) {
            return res.status(400).json({ message: "Parameter 'title' is required." });
        }

        const allReviews = await readJsonFile(REVIEWS_DATA_PATH);
        const filteredReviews = allReviews.filter(review =>
            review.title && review.title.toLowerCase().includes(showTitle.toLowerCase())
        );

        res.status(200).json(filteredReviews);
    } catch (error) {
        console.error('Error fetching reviews by show title:', error);
        res.status(500).json({ message: 'Failed to retrieve reviews data.', error: error.message });
    }
}

async function getPricesByShowTitle(req, res) {
    try {
        const showTitle = req.query.title;
        if (!showTitle) {
            return res.status(400).json({ message: "Parameter 'title' is required." });
        }

        const allShows = await readJsonFile(SHOWS_DATA_PATH);
        const showData = allShows.find(show =>
            show.title && show.title.toLowerCase() === showTitle.toLowerCase()
        );

        if (!showData || !showData.price) {
            return res.status(404).json({ message: `Price data not found for show '${showTitle}'.` });
        }

        res.status(200).json({ title: showData.title, price: showData.price });
    } catch (error) {
        console.error('Error fetching prices:', error);
        res.status(500).json({ message: 'Failed to retrieve price data.', error: error.message });
    }
}

module.exports = {
    getAllShows,
    getShowDetails,
    getReviewsByShowTitle,
    getPricesByShowTitle,
};