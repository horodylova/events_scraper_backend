const express = require('express');
const eventController = require('../controllers/eventController');
const dataController = require("../controllers/dataController");
const agentController = require("../controllers/agentController")

const router = express.Router();

router
.get('/scrape', eventController.getAndScrapeEvents)

.get('/shows', dataController.getAllShows)
.get('/details', dataController.getShowDetails) 
.get('/reviews', dataController.getReviewsByShowTitle) 
.get('/prices', dataController.getPricesByShowTitle)
    
.post('/ask-agent', agentController.askAgent)

module.exports = router;