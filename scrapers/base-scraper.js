const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');
const https = require('https');

const { brightData } = config;

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

class BaseScraper {
    constructor(name, baseUrl) {
        this.name = name;
        this.baseUrl = baseUrl;
    }

    async fetchDataWithBrightData(url) {
        console.log(`[${this.name}] Requesting URL: ${url} via Bright Data proxy...`);
        try {
            const response = await axios.get(url, {
                proxy: {
                    host: brightData.host,
                    port: brightData.port,
                    auth: {
                        username: brightData.username,
                        password: brightData.password,
                    }
                },
                httpsAgent: httpsAgent,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Referer': url,
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                }
            });
            console.log(`[${this.name}] Successfully received response. Status: ${response.status}`);
            return response.data;
        } catch (error) {
            console.error(`[${this.name}] Error fetching data:`, error.message);
            throw error;
        }
    }

    
    async scrape(limit) {
        throw new Error('scrape method must be implemented by subclass');
    }

     buildFullUrl(relativeUrl) {
        if (!relativeUrl) return null;
        try {
            return new URL(relativeUrl, this.baseUrl).href;
        } catch (error) {
            console.error(`[${this.name}] Error building URL:`, error.message);
            return null;
        }
    }
}

module.exports = BaseScraper;


