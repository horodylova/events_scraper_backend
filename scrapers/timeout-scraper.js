const BaseScraper = require('./base-scraper');
const cheerio = require('cheerio');

class TimeoutScraper extends BaseScraper {
    constructor() {
        super('TimeOut', 'https://www.timeout.com');
    }

    async scrape(limit = null) {
        try {
            const html = await this.fetchDataWithBrightData('https://www.timeout.com/london/theatre/london-theatre-reviews');
            const $ = cheerio.load(html);
            const shows = [];

            // Используем более точные селекторы для статей с обзорами
            $('article.tile_article_14y0w_1').each((i, el) => {
                if (limit && shows.length >= limit) return false;

                const $article = $(el);
                
                // Получаем заголовок
                const titleElement = $article.find('div._title_14y0w_9');
                const title = titleElement.text().trim();
                
                if (!title || title === 'RECOMMENDED' || title === 'Find recommended theatre in London' || 
                    title.includes('A-Z of West End shows')) {
                    return;
                }
                
                // Получаем ссылку на полный обзор
                const linkElement = titleElement.find('a');
                const link = linkElement.attr('href');
                
                // Получаем рейтинг
                let rating = null;
                const ratingElement = $article.find('div._ratingStar_1qrzr_1');
                if (ratingElement.length) {
                    const ratingText = ratingElement.find('span.sr-only').text().trim();
                    if (ratingText) {
                        // Извлекаем число из текста "4 out of 5 stars"
                        const ratingMatch = ratingText.match(/(\d+) out of (\d+) stars/);
                        if (ratingMatch) {
                            rating = `${ratingMatch[1]}/${ratingMatch[2]}`;
                        } else {
                            rating = ratingText;
                        }
                    }
                }
                
                // Получаем жанр/категорию
                let genre = null;
                const genreElement = $article.find('span._text_1t7gs_48');
                if (genreElement.length) {
                    genre = genreElement.text().trim();
                }
                
                // Получаем изображение
                let imageUrl = null;
                const imageContainer = $article.find('div._imageContainer_14y0w_45');
                if (imageContainer.length) {
                    const imgLink = imageContainer.find('a.titleImageLink');
                    if (imgLink.length) {
                        // Ищем атрибут src или data-src у изображения
                        const img = imgLink.find('img');
                        imageUrl = img.attr('src') || img.attr('data-src');
                    }
                }
                
                // Получаем описание/обзор
                let description = null;
                const summaryContainer = $article.find('div._summaryContainer_14y0w_363');
                if (summaryContainer.length) {
                    const descElement = summaryContainer.find('div._p_1xfg7_1');
                    if (descElement.length) {
                        description = descElement.text().trim();
                    }
                }
                
                // Получаем информацию о месте проведения и датах
                let venue = null;
                let dates = null;
                
                // Ищем теги с информацией о месте проведения
                const tagComponents = $article.find('li._tag_1t7gs_17 div._tagContainer_1bfie_8');
                tagComponents.each((i, tag) => {
                    const tagText = $(tag).text().trim();
                    if (tagText.includes('Theatre')) {
                        venue = tagText;
                    } else if (tagText.includes('Until')) {
                        dates = tagText;
                    }
                });
                
                // Добавляем собранные данные в массив
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