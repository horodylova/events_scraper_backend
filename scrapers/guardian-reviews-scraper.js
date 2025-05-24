class GuardianReviewsScraper extends BaseScraper {
    constructor() {
        super('Guardian', 'https://www.theguardian.com');
    }

    
    extractRating(title) {
    
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
            const html = await this.fetchDataWithBrightData('https://www.theguardian.com/stage');
            const $ = cheerio.load(html);
            const reviews = [];

            $('article, .fc-item, .fc-item--standard').each((i, el) => {
                if (limit && reviews.length >= limit) return false;

                const $el = $(el);
                const titleElement = $el.find('h3 a, .fc-item__title a, .headline a').first();
                const title = titleElement.text().trim();
                const link = titleElement.attr('href');
                const excerpt = $el.find('.fc-item__standfirst, .fc-trail__text, .summary').text().trim();
                const author = $el.find('.byline, .contributor, .fc-item__byline').text().trim();
                const dateElement = $el.find('time');
                const date = dateElement.attr('datetime') || dateElement.text().trim();

                // Фильтруем только театральные рецензии
                if (title && link && (title.toLowerCase().includes('review') || title.toLowerCase().includes('★'))) {
                    const rating = this.extractRating(title);
                    const showName = this.extractShowInfo(title);
                    const theatre = this.extractTheatre(title, excerpt);

                    reviews.push({
                        title: title,
                        fullPageUrl: this.buildFullUrl(link),
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
            return reviews;
        } catch (error) {
            console.error(`[${this.name}] Error in scrape:`, error.message);
            throw error;
        }
    }

    async searchReviews(showName, limit = 5) {
        try {
            const searchQuery = encodeURIComponent(`${showName} review site:theguardian.com/stage`);
            const searchUrl = `https://www.theguardian.com/search?q=${searchQuery}`;
            
            const html = await this.fetchDataWithBrightData(searchUrl);
            const $ = cheerio.load(html);
            const reviews = [];

            $('.search-result, .fc-item').each((i, el) => {
                if (limit && reviews.length >= limit) return false;

                const $el = $(el);
                const titleElement = $el.find('h3 a, .fc-item__title a').first();
                const title = titleElement.text().trim();
                const link = titleElement.attr('href');
                const excerpt = $el.find('.fc-item__standfirst, .search-result__text').text().trim();

                if (title && link && title.toLowerCase().includes('review')) {
                    const rating = this.extractRating(title);
                    
                    reviews.push({
                        title: title,
                        fullPageUrl: this.buildFullUrl(link),
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