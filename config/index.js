const config = {
    brightData: {
        username: 'brd-customer-hl_978bee1c-zone-scraping_browser_events',
        password: '87cv8gct5mg8',
        host: process.env.BRIGHT_DATA_HOST,
        port: parseInt(process.env.BRIGHT_DATA_PORT, 10),
        browserApiEndpoint: 'wss://brd-customer-hl_978bee1c-zone-scraping_browser_events:87cv8gct5mg8@brd.superproxy.io:9222'
    },
    huggingFace: {
        apiKey: process.env.HF_API_KEY,
        modelUrl: process.env.HF_MODEL_URL,
    }
};

module.exports = config;
