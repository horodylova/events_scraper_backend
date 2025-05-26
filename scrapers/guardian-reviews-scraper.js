const BaseScraper = require('./base-scraper');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const config = require('../config');

class GuardianReviewsScraper extends BaseScraper {
    constructor() {
        super('Guardian', 'https://www.theguardian.com/stage/stage+tone/reviews');
    }
    
    extractRating(element) {
         
        const starsElement = element.find('span.u-h');
        if (starsElement.length) {
            const starsText = starsElement.text().trim();
            const starsMatch = starsText.match(/(\d+)\s*out of\s*(\d+)\s*stars/);
            if (starsMatch) {
                return `${starsMatch[1]}/${starsMatch[2]}`;
            }
        }
        
         
        const title = element.find('.fc-item__title, h3').text().trim();
        const starMatch = title.match(/[★⭐]/g);
        if (starMatch) {
            return starMatch.length + '/5';
        }
        
        
        const textRatings = {
            'five star': '5/5',
            'four star': '4/5', 
            'three star': '3/5',
            'two star': '2/5',
            'one star': '1/5'
        };
        
        const lowerTitle = title.toLowerCase();
        for (const [text, rating] of Object.entries(textRatings)) {
            if (lowerTitle.includes(text)) {
                return rating;
            }
        }
        
        return null;
    }

    extractShowInfo(title) {
       
        const reviewPattern = /^(.+?)\s+review\s*[–-]/i;
        const match = title.match(reviewPattern);
        
        if (match) {
            const showName = match[1].trim();
            const cleanShowName = showName.replace(/[★⭐]+/g, '').trim();
            return cleanShowName;
        }
        
        return null;
    }

    extractTheatre(title, excerpt) {
        const theatrePatterns = [
            /at\s+(.+?)\s+theatre/i,
            /(\w+\s+theatre)/i,
            /(royal\s+\w+)/i,
            /(old\s+vic)/i,
            /(national\s+theatre)/i
        ];
        
        const text = `${title} ${excerpt}`.toLowerCase();
        
        for (const pattern of theatrePatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        
        return null;
    }

    async scrape(limit = null) {
        try {
            console.log(`[${this.name}] Starting browser-based scraping...`);
            
            const browser = await puppeteer.connect({
                browserWSEndpoint: config.brightData.browserApiEndpoint || process.env.BRIGHT_DATA_BROWSER_WS,
            });
            
            console.log(`[${this.name}] Connected to browser! Navigating to site...`);
            const page = await browser.newPage();
            
             await page.goto('https://www.theguardian.com/stage/stage+tone/reviews', { 
                waitUntil: "domcontentloaded", 
                timeout: 15000  
            });
            
            console.log(`[${this.name}] Page loaded! Waiting for content...`);
             
             await page.waitForSelector('.fc-item__container, .fc-item__content', { timeout: 15000 });  
            
             await new Promise(r => setTimeout(r, 3000));  
            
            const html = await page.content();
            console.log(`[${this.name}] HTML content retrieved, length: ${html.length}`);
            
            await browser.close();
            
            const $ = cheerio.load(html);
            const reviews = [];

             $('.fc-item__container, .fc-item__content, .fc-item').each((i, el) => {
                if (limit && reviews.length >= limit) return false;

                const $el = $(el);
                
                 const titleElement = $el.find('h3 a, .fc-item__title a, .js-headline-text');
                const title = titleElement.text().trim();
                const link = titleElement.closest('a').attr('href');
                
                 const excerpt = $el.find('.fc-item__standfirst').text().trim();
                
                 const author = $el.find('.fc-item__byline').text().trim();
                const dateElement = $el.find('time');
                const date = dateElement.attr('datetime') || dateElement.text().trim();

                 if (title && link && (title.toLowerCase().includes('review') || title.toLowerCase().includes('★'))) {
                    const rating = this.extractRating($el);
                    const showName = this.extractShowInfo(title);
                    const theatre = this.extractTheatre(title, excerpt);

                    reviews.push({
                        title: title,
                        fullPageUrl: link ? (link.startsWith('http') ? link : this.buildFullUrl(link)) : null,
                        excerpt: excerpt || null,
                        author: author || null,
                        publishedDate: date || null,
                        rating: rating,
                        showName: showName,
                        theatre: theatre,
                        isReview: true,
                        source: this.name,
                        scrapedAt: new Date().toISOString()
                    });
                }
            });

            console.log(`[${this.name}] Parsed ${reviews.length} theatre reviews.`);
            if (reviews.length === 0) {
                console.log(`[${this.name}] No reviews parsed. HTML snapshot for review (first 5000 chars):`);
                console.log(html.substring(0, 5000));
            }
            return reviews;
        } catch (error) {
            console.error(`[${this.name}] Error in scrape:`, error.message);
            if (error.pageContent) {
                console.error(`[${this.name}] Page content at the time of error (first 2000 chars):`, error.pageContent.substring(0,2000));
            }
            throw error;
        }
    }

    async searchReviews(showName, limit = 5) {
        try {
            console.log(`[${this.name}] Starting search for "${showName}"...`);
            
            const browser = await puppeteer.connect({
                browserWSEndpoint: config.brightData.browserApiEndpoint || process.env.BRIGHT_DATA_BROWSER_WS,
            });
            
            const page = await browser.newPage();
            
            const searchQuery = encodeURIComponent(`${showName} review site:theguardian.com/stage`);
            const searchUrl = `https://www.theguardian.com/search?q=${searchQuery}`;
            
            await page.goto(searchUrl, { 
                waitUntil: "domcontentloaded", 
                timeout: 15000  
            });
            
            console.log(`[${this.name}] Search page loaded! Waiting for results...`);
            
            await page.waitForSelector('.search-results, .fc-item__container', { timeout: 15000 });
            
            await new Promise(r => setTimeout(r, 3000));
            
            const html = await page.content();
            console.log(`[${this.name}] Search results retrieved, length: ${html.length}`);
            
            await browser.close();
            
            const $ = cheerio.load(html);
            const reviews = [];

            $('.search-result, .fc-item').each((i, el) => {
                if (limit && reviews.length >= limit) return false;

                const $el = $(el);
                const titleElement = $el.find('h3 a, .fc-item__title a, .js-headline-text').first();
                const title = titleElement.text().trim();
                const link = titleElement.closest('a').attr('href');
                const excerpt = $el.find('.fc-item__standfirst, .search-result__text').text().trim();

                if (title && link && title.toLowerCase().includes('review')) {
                    const rating = this.extractRating($el);
                    
                    reviews.push({
                        title: title,
                        fullPageUrl: link ? (link.startsWith('http') ? link : this.buildFullUrl(link)) : null,
                        excerpt: excerpt || null,
                        rating: rating,
                        showName: showName,
                        searchQuery: showName,
                        isSearchResult: true,
                        source: this.name,
                        scrapedAt: new Date().toISOString()
                    });
                }
            });

            console.log(`[${this.name}] Found ${reviews.length} reviews for "${showName}".`);
            return reviews;
        } catch (error) {
            console.error(`[${this.name}] Error searching for "${showName}":`, error.message);
            throw error;
        }
    }
}

module.exports = GuardianReviewsScraper;