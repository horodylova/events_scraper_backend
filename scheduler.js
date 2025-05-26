require('dotenv').config();
const schedule = require('node-schedule');
const { TheatreDataAggregator } = require('./scrapers/index');
const dataService = require('./data/eventStorage');

console.log('Scheduler started...');

 async function runScraping() {
  console.log(`[${new Date().toISOString()}] Starting scheduled scraping...`);
  try {
    const aggregator = new TheatreDataAggregator();
    const results = await aggregator.scrapeAll();
    
     const savedData = await dataService.saveNewEvents([...results.shows, ...results.reviews]);
    
    console.log(`[${new Date().toISOString()}] Scheduled scraping completed!`);
    console.log(`Total sources: ${results.totalSources}`);
    console.log(`Successful sources: ${results.successfulSources}`);
    console.log(`Total shows: ${savedData.shows.length}`);
    console.log(`Total reviews: ${savedData.reviews.length}`);
    console.log(`Errors: ${results.errors.length}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in scheduled scraping:`, error.message);
  }
}

 runScraping();

 const job = schedule.scheduleJob('0 0 */2 * *', function() {
  runScraping();
});

console.log(`Next scraping scheduled at: ${job.nextInvocation().toString()}`);

 process.stdin.resume();

 process.on('SIGINT', function() {
  console.log('Stopping scheduler...');
  job.cancel();
  process.exit(0);
});