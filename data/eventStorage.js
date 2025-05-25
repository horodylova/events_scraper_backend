const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const SHOWS_FILE_PATH = path.join(__dirname, 'shows.json');
const REVIEWS_FILE_PATH = path.join(__dirname, 'reviews.json');

console.log('Data files paths:');
console.log('Shows:', SHOWS_FILE_PATH);
console.log('Reviews:', REVIEWS_FILE_PATH);

async function readFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        if (data.trim() === '') {
            return [];
        }
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`${path.basename(filePath)} not found. Creating a new one.`);
        } else if (error instanceof SyntaxError) {
            console.warn(`Error parsing ${path.basename(filePath)}. File might be corrupted. Starting with empty data.`);
        } else {
            console.error(`Error reading ${path.basename(filePath)}:`, error);
        }
        return [];
    }
}

async function writeFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}


async function readShows() {
    return readFile(SHOWS_FILE_PATH);
}

async function readReviews() {
    return readFile(REVIEWS_FILE_PATH);
}

async function writeShows(shows) {
    await writeFile(SHOWS_FILE_PATH, shows);
}

async function writeReviews(reviews) {
    await writeFile(REVIEWS_FILE_PATH, reviews);
}

async function saveNewEvents(newScrapedEvents) {
    const newShows = newScrapedEvents.filter(event => event.source !== 'TimeOut');
    const newReviews = newScrapedEvents.filter(event => event.source === 'TimeOut');
    

    const existingShows = await readShows();
    const existingReviews = await readReviews();
    
    const processedShows = await processShows(existingShows, newShows);
    
    const processedReviews = await processReviews(existingReviews, newReviews, processedShows);
    
    await writeShows(processedShows);
    await writeReviews(processedReviews);
    
    console.log(`Successfully saved ${processedShows.length} shows and ${processedReviews.length} reviews.`);
    
    return {
        shows: processedShows,
        reviews: processedReviews
    };
}
 
async function processShows(existingShows, newShows) {
    const result = [...existingShows];
    const titleMap = new Map(result.map(show => [show.title.toLowerCase(), show]));
    
    for (const newShow of newShows) {
        const normalizedTitle = newShow.title.toLowerCase();
        
        if (titleMap.has(normalizedTitle)) {
         
            const existingShow = titleMap.get(normalizedTitle);
            
            
            if (new Date(newShow.scrapedAt) > new Date(existingShow.scrapedAt)) {
              
                const showId = existingShow.id;
                
            
                const imageUrl = existingShow.imageUrl || newShow.imageUrl;
      
                Object.assign(existingShow, newShow, { id: showId, imageUrl });
            }
        } else {
            
            const showWithId = {
                id: crypto.randomUUID(),
                ...newShow
            };
            result.push(showWithId);
            titleMap.set(normalizedTitle, showWithId);
        }
    }
    
    return result;
}

 
async function processReviews(existingReviews, newReviews, shows) {
    const result = [...existingReviews];
    const reviewMap = new Map();
    
    for (const review of result) {
        reviewMap.set(review.title.toLowerCase(), review);
    }
     
    const showMap = new Map(shows.map(show => [show.title.toLowerCase(), show]));
    
    for (const newReview of newReviews) {
        const normalizedTitle = newReview.title.toLowerCase();
         
        if (showMap.has(normalizedTitle)) {
            const relatedShow = showMap.get(normalizedTitle);
            newReview.showId = relatedShow.id;
            
        
            if (relatedShow.imageUrl) {
                newReview.imageUrl = relatedShow.imageUrl;
            }
        }
        
        if (reviewMap.has(normalizedTitle)) {
        
            const existingReview = reviewMap.get(normalizedTitle);
          
            if (new Date(newReview.scrapedAt) > new Date(existingReview.scrapedAt)) {
         
                const reviewId = existingReview.id;
                
              
                Object.assign(existingReview, newReview, { id: reviewId });
            }
        } else {
         
            const reviewWithId = {
                id: crypto.randomUUID(),
                ...newReview
            };
            result.push(reviewWithId);
            reviewMap.set(normalizedTitle, reviewWithId);
        }
    }
    
    return result;
}
 
async function readEvents() {
    const shows = await readShows();
    const reviews = await readReviews();
    return [...shows, ...reviews];
}

module.exports = {
    readEvents,
    readShows,
    readReviews,
    writeShows,
    writeReviews,
    saveNewEvents,
};
