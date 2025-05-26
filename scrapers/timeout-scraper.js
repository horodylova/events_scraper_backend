const BaseScraper = require('./base-scraper');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const config = require('../config');

class TimeoutScraper extends BaseScraper {
    constructor() {
        super('TimeOut', 'https://www.timeout.com');
    }

    async scrape(limit = null) {
        try {
            console.log(`[${this.name}] Starting browser-based scraping...`);
            
           
            const browser = await puppeteer.connect({
                browserWSEndpoint: config.brightData.browserApiEndpoint || process.env.BRIGHT_DATA_BROWSER_WS,
            });
            
            console.log(`[${this.name}] Connected to browser! Navigating to site...`);
            const page = await browser.newPage();
            
            
            await page.goto('https://www.timeout.com/london/theatre/london-theatre-reviews', { 
                waitUntil: "domcontentloaded", 
                timeout: 30000 
            });
            
            console.log(`[${this.name}] Page loaded! Waiting for content...`);
            
           
            await page.waitForSelector('article, h3, div[data-testid]', { timeout: 30000 });
            
        
            const html = await page.content();
            
          
            await browser.close();
            
          
            const $ = cheerio.load(html);
            const shows = [];
            
         
            const reviewElements = $('article, div[data-testid]');
            console.log(`[${this.name}] Found ${reviewElements.length} potential review elements`);
            
          
            reviewElements.each((i, el) => {
                if (limit && shows.length >= limit) return false;
                
                const $article = $(el);
                
        
                let title = null;
                const titleElement = $article.find('h3, h2');
                if (titleElement.length) {
                    title = titleElement.text().trim();
                }
                
            
                if (!title || 
                    title === 'RECOMMENDED' || 
                    title === 'Find recommended theatre in London' || 
                    title.includes('A-Z of West End shows')) {
                    return;
                }
                
           
                let link = null;
                const linkElement = $article.find('a');
                if (linkElement.length) {
                    link = linkElement.attr('href');
                }
                
             
                let rating = null;
                const ratingText = $article.find('span:contains("out of 5 stars")').text().trim();
                if (ratingText) {
                    const ratingMatch = ratingText.match(/(\d+) out of (\d+) stars/);
                    if (ratingMatch) {
                        rating = `${ratingMatch[1]}/${ratingMatch[2]}`;
                    } else {
                        rating = ratingText;
                    }
                }
                
              
                let genre = null;
                $article.find('span').each((i, el) => {
                    const text = $(el).text().trim();
                    if (text === 'Drama' || text === 'Comedy' || text === 'Musicals') {
                        genre = text;
                        return false;
                    }
                });
                
              
                let imageUrl = null;
                const imgElement = $article.find('img');
                if (imgElement.length) {
                    imageUrl = imgElement.attr('src') || imgElement.attr('data-src');
                }
                
            
                let description = null;
                const descElement = $article.find('p');
                if (descElement.length) {
                    description = descElement.first().text().trim();
                }
                
            
                let venue = null;
                let dates = null;
                
                $article.find('span, div').each((i, el) => {
                    const text = $(el).text().trim();
                    if (text.includes('Until')) {
                        dates = text;
                    } else if (
                        text.includes('Theatre') || 
                        text.includes('Park') || 
                        text.includes('Garden') || 
                        text.includes('Road') || 
                        text.includes('Bank')
                    ) {
                        venue = text;
                    }
                });
                
               
                if (title) {
                    shows.push({
                        title: title,
                        fullPageUrl: this.buildFullUrl(link),
                        imageUrl: this.buildFullUrl(imageUrl),
                        rating: rating,
                        genre: genre,
                        venue: venue,
                        dates: dates,
                        description: description,
                        source: this.name,
                        scrapedAt: new Date().toISOString()
                    });
                }
            });
            
            console.log(`[${this.name}] Parsed ${shows.length} shows.`);
            return shows;
        } catch (error) {
            console.error(`[${this.name}] Error in scrape:`, error.message);
            throw error;
        }
    }
}

module.exports = TimeoutScraper;
