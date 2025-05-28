const express = require('express');
const eventController = require('../controllers/eventController');
const dataController = require("../controllers/dataController");
const agentController = require("../controllers/agentController")

const router = express.Router();

router
.get('/scrape', eventController.getAndScrapeEvents)

router
    .get('/api/theatre/shows', dataController.getAllShows)
    .get('/api/theatre/details', dataController.getShowDetails) 
    .get('/api/theatre/reviews', dataController.getReviewsByShowTitle) 
    .get('/api/theatre/prices', dataController.askAgent)
    
router
.post('/ask-agent', eventController.askAgent)

module.exports = router;