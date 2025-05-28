const config = {
    brightData: {
        username: process.env.BRIGHT_DATA_USERNAME,
        password: process.env.BRIGHT_DATA_PASSWORD,
        host: process.env.BRIGHT_DATA_HOST,
        port: parseInt(process.env.BRIGHT_DATA_PORT, 10),
        browserApiEndpoint: process.env.BRIGHT_DATA_BROWSER_WS
    }
};

module.exports = config;
