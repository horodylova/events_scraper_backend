const express = require('express');
const eventController = require('../controllers/eventController');

const router = express.Router();

router
.get('/scrape', eventController.getAndScrapeEvents)

module.exports = router;