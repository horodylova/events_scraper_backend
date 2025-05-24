const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');
const https = require('https');

const { brightData, britishMuseum } = config;

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

async function fetchDataWithBrightData(url) {
    console.log(`Requesting URL: ${url} via Bright Data proxy...`);
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
                'Host': 'www.britishmuseum.org',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.britishmuseum.org/',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        });
        console.log(`Successfully received response from ${url}. Status: ${response.status}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching data from ${url} via Bright Data:`, error.message);
        if (error.response && error.response.status === 407) {
            console.error('Proxy Authentication Required (407). Check Bright Data credentials.');
        }
        throw error;
    }
}

async function scrapeMuseumEvents() {
    try {
        const html = await fetchDataWithBrightData(britishMuseum.eventsUrl);
        return html;
    } catch (error) {
        console.error('Error in scrapeMuseumEvents:', error.message);
        throw error;
    }
}

module.exports = {
    scrapeMuseumEvents,
};