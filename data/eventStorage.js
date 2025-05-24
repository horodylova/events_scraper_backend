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

// Обработка шоу с предотвращением дублирования
async function processShows(existingShows, newShows) {
    const result = [...existingShows];
    const titleMap = new Map(result.map(show => [show.title.toLowerCase(), show]));
    
    for (const newShow of newShows) {
        const normalizedTitle = newShow.title.toLowerCase();
        
        if (titleMap.has(normalizedTitle)) {
            // Обновляем существующее шоу
            const existingShow = titleMap.get(normalizedTitle);
            
            // Обновляем только если новые данные свежее
            if (new Date(newShow.scrapedAt) > new Date(existingShow.scrapedAt)) {
                // Сохраняем ID существующего шоу
                const showId = existingShow.id;
                
                // Приоритизация изображений - сохраняем существующее, если оно есть
                const imageUrl = existingShow.imageUrl || newShow.imageUrl;
                
                // Обновляем данные
                Object.assign(existingShow, newShow, { id: showId, imageUrl });
            }
        } else {
            // Добавляем новое шоу с уникальным ID
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

// Обработка обзоров с предотвращением дублирования и связыванием с шоу
async function processReviews(existingReviews, newReviews, shows) {
    const result = [...existingReviews];
    const reviewMap = new Map();
    
    // Создаем карту существующих обзоров по названию спектакля
    for (const review of result) {
        reviewMap.set(review.title.toLowerCase(), review);
    }
    
    // Создаем карту шоу по названию для связывания
    const showMap = new Map(shows.map(show => [show.title.toLowerCase(), show]));
    
    for (const newReview of newReviews) {
        const normalizedTitle = newReview.title.toLowerCase();
        
        // Связываем обзор с шоу, если оно существует
        if (showMap.has(normalizedTitle)) {
            const relatedShow = showMap.get(normalizedTitle);
            newReview.showId = relatedShow.id;
            
            // Приоритизация изображений - используем изображение из шоу, если оно есть
            if (relatedShow.imageUrl) {
                newReview.imageUrl = relatedShow.imageUrl;
            }
        }
        
        if (reviewMap.has(normalizedTitle)) {
            // Обновляем существующий обзор
            const existingReview = reviewMap.get(normalizedTitle);
            
            // Обновляем только если новые данные свежее
            if (new Date(newReview.scrapedAt) > new Date(existingReview.scrapedAt)) {
                // Сохраняем ID существующего обзора
                const reviewId = existingReview.id;
                
                // Обновляем данные
                Object.assign(existingReview, newReview, { id: reviewId });
            }
        } else {
            // Добавляем новый обзор с уникальным ID
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

// Для обратной совместимости - чтение всех событий
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
